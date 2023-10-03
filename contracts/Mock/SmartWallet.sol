// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

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
