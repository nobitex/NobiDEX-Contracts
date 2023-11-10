// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract SmartWallet {
    bytes4 internal constant MAGICVALUE = 0x1626ba7e;
    uint8 signMessageThreshold;
    mapping(address => bool) ownerAddresses;
    mapping(bytes32 => mapping(address => bool)) public approvedHashByOwner;
    mapping(bytes32 => uint8) public hashApprovalCount;

    modifier onlyOwner() {
        require(ownerAddresses[msg.sender], "ERROR: unauthorized caller");
        _;
    }

    constructor(address[] memory _ownerAdresses, uint8 _signMessageThreshold) {
        signMessageThreshold = _signMessageThreshold;
        for (uint256 i = 0; i < _ownerAdresses.length; ) {
            ownerAddresses[_ownerAdresses[i]] = true;

            unchecked {
                i++;
            }
        }
    }

    function approveHash(bytes32 _messageHash) public onlyOwner {
        require(
            !approvedHashByOwner[_messageHash][msg.sender],
            "ERROR: Already approved."
        );
        hashApprovalCount[_messageHash]++;
    }

    function ERC20Approve(
        address _token,
        address _spender,
        uint256 _amount
    ) public onlyOwner returns (bool) {
        require(IERC20(_token).approve(_spender, _amount), "ERROR: Approval failed");
        return true;
    }

    function isValidSignature(
        bytes32 _hash,
        bytes memory _signature
    ) public view returns (bytes4 magicValue) {
        if (hashApprovalCount[_hash] >= signMessageThreshold) {
            return MAGICVALUE;
        } else {
            return 0xffffffff;
        }
    }
}
