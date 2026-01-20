// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract TokenTransaction {
    IERC20 public token;

    constructor(address tokenAddress) {
        token = IERC20(tokenAddress);
    }

    // Send token from one address to another
    function transferToken(address from, address to, uint256 amount) external {
        // Needs prior approval from 'from'
        require(token.allowance(from, address(this)) >= amount, "Allowance not enough");
        bool sent = token.transferFrom(from, to, amount);
        require(sent, "Transfer failed");
    }
}
