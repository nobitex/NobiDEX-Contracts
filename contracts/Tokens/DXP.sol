// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract RDXP is ERC20 {
    mapping(address => uint256) private balances;
    mapping(address => mapping(address => uint256)) private allowances;
    uint256 private epoch;
    uint256 private currentEpochMaxMintAmount;

                                                                                                                                                                                                                                                                                                                                                                                                                                                     constructor(
        string memory _name,
        string memory _symbol
    ) ERC20(_name, _symbol) {
        epoch = 0;
        currentEpochMaxMintAmount = 0;
    }

    function calculateEpochMintAmount() public view returns (uint256) {
        // sigmoid formula
        // return totalMintAmount
    }

    function calculateDistributionAmounts() public view returns (uint256) {
        // logic for calculating the end of epoch token distribution amounts here
        // Example: return someValue;
    }

    function distributeEndOfEpochTokens() public {  
        require(
            currentEpochMaxMintAmount > 0,
            "No tokens to distribute in the current epoch"
        );
        uint256 distributionAmount = calculateDistributionAmounts();
        // logic for distributing the end of epoch tokens here
    }

    function updateBalances(
        address[] memory accounts,
        uint256[] memory amounts
    ) private {
        require(accounts.length == amounts.length, "ERROR: INVALID INPUT.");
        for (uint256 i = 0; i < accounts.length; ) {
                    balances[accounts[i]] = amounts[i];

            unchecked {
                i++;
            }
        }
 
    }

    function claimRDXP() public {
        // logic for claiming RDXP tokens here
        // emit event
    }


    function checkBalance(address account) public view returns (uint256) {
        return balances[account];
    }


    // Additional functions to set epoch and current epoch max mint amount
    function setEpoch(uint256 _epoch) public {
        epoch = _epoch;
    }

    function setCurrentEpochMaxMintAmount(uint256 _amount) public {
        // calculate from the functions
        currentEpochMaxMintAmount = _amount;
    }
}
