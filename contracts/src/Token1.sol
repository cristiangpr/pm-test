// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";


contract Token1 is ERC20 {
    constructor() ERC20("Token1", "TKN1") {}

    function mint(address to, uint256 amount) public  {
        _mint(to, amount);
    }
}