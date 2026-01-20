// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title Treasury
 * @dev Handles platform fees and withdrawals for the LuckyBase platform.
 */
contract Treasury is Ownable {
    using SafeERC20 for IERC20;
    uint256 public constant FEE_PERCENT = 10; // 10% platform fee

    event FeeCollected(address indexed from, uint256 amount);
    event Withdrawn(address indexed owner, uint256 amount);

    constructor(address initialOwner) Ownable(initialOwner) {}

    /**
     * @dev Allows the contract to receive ETH.
     */
    receive() external payable {
        if (msg.value > 0) {
            emit FeeCollected(msg.sender, msg.value);
        }
    }

    /**
     * @dev Withdraws accumulated fees to the owner.
     * @param amount The amount of ETH to withdraw.
     */
    function withdraw(uint256 amount) external onlyOwner {
        require(amount <= address(this).balance, "Insufficient balance");
        (bool success, ) = payable(owner()).call{value: amount}("");
        require(success, "Withdrawal failed");
        emit Withdrawn(owner(), amount);
    }

    /**
     * @dev Withdraws accumulated ERC20 tokens to the owner.
     * @param token The address of the token to withdraw.
     * @param amount The amount of tokens to withdraw.
     */
    function withdrawToken(address token, uint256 amount) external onlyOwner {
        IERC20(token).safeTransfer(owner(), amount);
    }

    /**
     * @dev Returns the current balance of the treasury.
     */
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
