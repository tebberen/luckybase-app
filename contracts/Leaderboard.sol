// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Leaderboard
 * @dev Tracks user wins, losses, and total volume for LuckyBase games.
 */
contract Leaderboard is Ownable {
    struct Stats {
        uint256 wins;
        uint256 losses;
        uint256 totalVolume;
    }

    mapping(address => Stats) public userStats;
    mapping(address => bool) public authorizedGames;

    event StatsUpdated(address indexed user, uint256 wins, uint256 losses, uint256 totalVolume);
    event GameAuthorized(address indexed game, bool authorized);

    constructor(address initialOwner) Ownable(initialOwner) {}

    modifier onlyAuthorized() {
        require(authorizedGames[msg.sender] || msg.sender == owner(), "Not authorized");
        _;
    }

    /**
     * @dev Authorizes a game contract to update stats.
     */
    function setAuthorizedGame(address game, bool authorized) external onlyOwner {
        authorizedGames[game] = authorized;
        emit GameAuthorized(game, authorized);
    }

    /**
     * @dev Records a win for a user.
     */
    function recordWin(address user, uint256 volume) external onlyAuthorized {
        userStats[user].wins += 1;
        userStats[user].totalVolume += volume;
        emit StatsUpdated(user, userStats[user].wins, userStats[user].losses, userStats[user].totalVolume);
    }

    /**
     * @dev Records a loss for a user.
     */
    function recordLoss(address user, uint256 volume) external onlyAuthorized {
        userStats[user].losses += 1;
        userStats[user].totalVolume += volume;
        emit StatsUpdated(user, userStats[user].wins, userStats[user].losses, userStats[user].totalVolume);
    }

    /**
     * @dev Returns stats for a user.
     */
    function getUserStats(address user) external view returns (uint256 wins, uint256 losses, uint256 totalVolume) {
        Stats storage stats = userStats[user];
        return (stats.wins, stats.losses, stats.totalVolume);
    }
}
