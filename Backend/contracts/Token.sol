// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20; // Update to 0.8.20 for OpenZeppelin

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract FindToken is ERC20 {
    address public owner;

    constructor() ERC20("FindToken", "FND") {
        owner = msg.sender;
        _mint(owner, 1000000 * 10 ** decimals());
    }

    function mint(address to, uint256 amount) external {
        require(msg.sender == owner, "Only owner can mint tokens");
        _mint(to, amount);
    }
}
