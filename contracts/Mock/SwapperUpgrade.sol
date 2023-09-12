// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

import '../Exchange/Swapper.sol';

contract SwapperUpgrade is Swapper {
    function testUpgradeability() external view returns (address) {
        return address(this);
    }
}
