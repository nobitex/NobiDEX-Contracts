// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../Exchange/Swapper.sol";

contract UserInfo {
    struct TokenBalance {
        address tokenAddress;
        uint256 tokenBalance;
    }

    struct TokenAllowance {
        address tokenAddress;
        uint256 tokenAllowance;
    }

    struct UserInfoDate {
        TokenBalance[] tokenBalances;
        TokenAllowance[] tokenAllowances;
        uint256 blockNumber;
        uint256 codeSize;
        bool isRevoked;
    }

    function getTokenBalances(
        address userAddress,
        address[] memory tokenAddresses
    ) internal view returns (TokenBalance[] memory) {
        TokenBalance[] memory balances = new TokenBalance[](
            tokenAddresses.length
        );
        for (uint256 i = 0; i < tokenAddresses.length; i++) {
            balances[i].tokenAddress = tokenAddresses[i];
            balances[i].tokenBalance = IERC20(tokenAddresses[i]).balanceOf(
                userAddress
            );
        }
        return balances;
    }

    function getAllowances(
        address[] memory tokenAddresses,
        address userAddress,
        address swapperAddress
    ) internal view returns (TokenAllowance[] memory) {
        TokenAllowance[] memory allowances = new TokenAllowance[](
            tokenAddresses.length
        );
        for (uint256 i = 0; i < tokenAddresses.length; i++) {
            allowances[i].tokenAddress = tokenAddresses[i];
            allowances[i].tokenAllowance = IERC20(tokenAddresses[i]).allowance(
                userAddress,
                swapperAddress
            );
        }

        return allowances;
    }

    function getBlockNumber() internal view returns (uint256) {
        return block.number;
    }

    function getCodeSize(address userAddress) internal view returns (uint256) {
        uint256 codeSize;
        assembly {
            codeSize := extcodesize(userAddress)
        }
        return codeSize;
    }

    function getOrderRevokedStatus(
        address userAddress,
        uint64 orderID,
        address swapperAddress
    ) internal view returns (bool) {
        Swapper swapper = Swapper(swapperAddress);
        bool orderStatus = swapper.orderRevokedStatus(userAddress, orderID);
        return orderStatus;
    }

    function getUserInfo(
        address userAddress,
        address[] memory tokenAddresses,
        address swapperAddress,
        uint64 orderID
    ) external view returns (UserInfoDate memory) {
        UserInfoDate memory data;
        data.tokenBalances = getTokenBalances(userAddress, tokenAddresses);
        data.tokenAllowances = getAllowances(
            tokenAddresses,
            userAddress,
            swapperAddress
        );
        data.blockNumber = getBlockNumber();
        data.codeSize = getCodeSize(userAddress);
        data.isRevoked = getOrderRevokedStatus(
            userAddress,
            orderID,
            swapperAddress
        );
        return data;
    }
}
