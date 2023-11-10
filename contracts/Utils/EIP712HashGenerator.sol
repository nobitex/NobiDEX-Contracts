//SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

contract EIP712HashGenerator {
    bytes32 public DOMAIN_SEPARATOR;

    struct EIP712Domain {
        string name;
        string version;
        uint256 chainId;
        address verifyingContract;
    }

    bytes32 internal constant EIP712_DOMAIN_TYPEHASH =
        keccak256(
            "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
        );

    //onlyInitializing
    function __EIP712HashGenerator_init(
        string memory _name,
        string memory _version
    ) internal {
        DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                EIP712_DOMAIN_TYPEHASH,
                keccak256(bytes(_name)),
                keccak256(bytes(_version)),
                block.chainid,
                address(this)
            )
        );
    }

    function HashTypedMessage(
        bytes32 messageHash
    ) internal view returns (bytes32) {
        return
            keccak256(
                abi.encodePacked("\x19\x01", DOMAIN_SEPARATOR, messageHash)
            );
    }
}
