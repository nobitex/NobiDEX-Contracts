// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';

contract FakeErc20 is ERC20 {
    constructor(string memory _name, string memory _symbol) ERC20(_name, _symbol) {
        _mint(_msgSender(), 1_000_000_000 * 10 ** 18);
    }
}
