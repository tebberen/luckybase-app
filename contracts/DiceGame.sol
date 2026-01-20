// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./Treasury.sol";
import "./Leaderboard.sol";

/**
 * @title DiceGame
 * @dev 1v1 Dice Game module for LuckyBase supporting ETH and USDC.
 */
contract DiceGame is Ownable {
    using SafeERC20 for IERC20;

    struct Game {
        address player1;
        address player2;
        address token; // address(0) for ETH
        uint256 stake;
        uint256 startTime;
        bool isActive;
    }

    Treasury public immutable treasury;
    Leaderboard public immutable leaderboard;
    IERC20 public immutable usdc;

    uint256 public nextGameId;
    mapping(uint256 => Game) public games;

    event GameCreated(uint256 indexed gameId, address player1, address token, uint256 stake);
    event GameJoined(uint256 indexed gameId, address player2);
    event GameResolved(uint256 indexed gameId, address winner, uint256 roll1, uint256 roll2, uint256 payout);
    event Refunded(uint256 indexed gameId, address player1, uint256 amount);

    constructor(address initialOwner, address payable _treasury, address _leaderboard, address _usdc) Ownable(initialOwner) {
        require(_treasury != address(0), "Invalid treasury address");
        require(_leaderboard != address(0), "Invalid leaderboard address");
        treasury = Treasury(_treasury);
        leaderboard = Leaderboard(_leaderboard);
        usdc = IERC20(_usdc);
    }

    /**
     * @dev Creates a new 1v1 dice game with ETH.
     */
    function createGameETH() external payable {
        require(msg.value >= 0.1 ether, "Min stake 0.1 ETH");

        _createGame(msg.sender, address(0), msg.value);
    }

    /**
     * @dev Creates a new 1v1 dice game with USDC.
     * @param amount The amount of USDC to stake.
     */
    function createGameUSDC(uint256 amount) external {
        require(amount >= 0.1 * 10**6, "Min stake 0.1 USDC"); // Assuming USDC has 6 decimals

        usdc.safeTransferFrom(msg.sender, address(this), amount);
        _createGame(msg.sender, address(usdc), amount);
    }

    function _createGame(address player1, address token, uint256 stake) internal {
        games[nextGameId] = Game({
            player1: player1,
            player2: address(0),
            token: token,
            stake: stake,
            startTime: block.timestamp,
            isActive: true
        });

        emit GameCreated(nextGameId, player1, token, stake);
        nextGameId++;
    }

    /**
     * @dev Joins an existing game.
     * @param gameId The ID of the game to join.
     */
    function joinGame(uint256 gameId) external payable {
        Game storage game = games[gameId];
        require(game.isActive, "Game not active");
        require(game.player2 == address(0), "Game already joined");
        require(msg.sender != game.player1, "Cannot play against yourself");

        if (game.token == address(0)) {
            require(msg.value == game.stake, "Must match ETH stake");
        } else {
            require(msg.value == 0, "Do not send ETH for USDC game");
            usdc.safeTransferFrom(msg.sender, address(this), game.stake);
        }

        game.player2 = msg.sender;
        emit GameJoined(gameId, msg.sender);

        _resolveGame(gameId);
    }

    /**
     * @dev Internal function to resolve the game using prevrandao for randomness.
     */
    function _resolveGame(uint256 gameId) internal {
        Game storage game = games[gameId];

        uint256 roll1;
        uint256 roll2;
        uint256 nonce = 0;

        // Re-roll on tie
        while (true) {
            roll1 = (uint256(keccak256(abi.encodePacked(block.prevrandao, gameId, nonce, "player1"))) % 6) + 1;
            roll2 = (uint256(keccak256(abi.encodePacked(block.prevrandao, gameId, nonce, "player2"))) % 6) + 1;

            if (roll1 != roll2) break;
            nonce++;
            require(nonce < 100, "Too many re-rolls");
        }

        address winner = roll1 > roll2 ? game.player1 : game.player2;
        address loser = roll1 > roll2 ? game.player2 : game.player1;
        uint256 totalStake = game.stake * 2;
        uint256 fee = (totalStake * treasury.FEE_PERCENT()) / 100;
        uint256 payout = totalStake - fee;

        game.isActive = false;

        // Update Leaderboard (simplified volume tracking)
        try leaderboard.recordWin(winner, totalStake) {} catch {}
        try leaderboard.recordLoss(loser, totalStake) {} catch {}

        if (game.token == address(0)) {
            // Transfer ETH fee to Treasury
            (bool feeSuccess, ) = payable(address(treasury)).call{value: fee}("");
            require(feeSuccess, "Fee transfer failed");

            // Transfer ETH payout to Winner
            (bool payoutSuccess, ) = payable(winner).call{value: payout}("");
            require(payoutSuccess, "Payout failed");
        } else {
            // Transfer USDC fee to Treasury (Treasury needs to support USDC or we just send it to its owner)
            // For simplicity, we send fees to the treasury address, but treasury might need a way to withdraw USDC.
            usdc.safeTransfer(address(treasury), fee);
            usdc.safeTransfer(winner, payout);
        }

        emit GameResolved(gameId, winner, roll1, roll2, payout);
    }

    /**
     * @dev Allows player1 to refund their stake if no opponent joined after 24 hours.
     */
    function refund(uint256 gameId) external {
        Game storage game = games[gameId];
        require(game.isActive, "Game not active");
        require(game.player2 == address(0), "Game already joined");
        require(msg.sender == game.player1, "Only player1 can refund");
        require(block.timestamp >= game.startTime + 24 hours, "Wait 24 hours");

        game.isActive = false;
        uint256 amount = game.stake;

        if (game.token == address(0)) {
            (bool success, ) = payable(game.player1).call{value: amount}("");
            require(success, "Refund failed");
        } else {
            usdc.safeTransfer(game.player1, amount);
        }

        emit Refunded(gameId, game.player1, amount);
    }
}
