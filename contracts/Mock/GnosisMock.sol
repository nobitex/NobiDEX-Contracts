// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

import "hardhat/console.sol";

contract GnosisMock {
    mapping(address => bool) owners;

    constructor(address[] memory _owners) {
        for (uint256 i = 0; i < _owners.length; ) {
            owners[_owners[i]] = true;

            unchecked {
                i++;
            }
        }
    }

    // function _isOwner(address _caller) internal returns (bool) {
    //     (bool success, bytes memory data) = Moderator.call(
    //         abi.encodeWithSignature("isOwner(address)", _caller)
    //     );
    //     require(success, "ERROR: external call failed");
    //     return abi.decode(data, (bool));
    // }
    function isOwner(address _owner) public view returns (bool) {
        return owners[_owner];
    }

    function updateSwapperFee(address _swapper, uint16 _newFeeRatio) external {
        (bool success, bytes memory data) = _swapper.call(
            abi.encodeWithSignature("updateFeeRatio(uint16)", _newFeeRatio)
        );
        require(success, "ERROR: external call failed");
    }

    function proposeToUpdateSwapperModerator(
        address _swapper,
        address _newModerator
    ) external {
        (bool success, bytes memory data) = _swapper.call(
            abi.encodeWithSignature(
                "proposeToUpdateModerator(address)",
                _newModerator
            )
        );
        require(success, "ERROR: external call failed");
    }

    function unpauseSwapper(address _swapper) external {
        (bool success, bytes memory data) = _swapper.call(
            abi.encodeWithSignature("unpause()")
        );
        require(success, "ERROR: external call failed");
    }

    // // function updateSwapperModerator(
    // //     address _swapper,
    // //     address[] memory _tokenAddresses
    // // ) external {
    // //     (bool success, bytes memory data) = _swapper.call(
    // //         abi.encodeWithSignature("pause(address[])  ", _tokenAddresses)
    // //     );
    // //     require(success, "ERROR: external call failed");
    // }

    function upgradeSwapper(
        address _swapper,
        address _implementation
    ) external {
        (bool success, bytes memory data) = _swapper.call(
            abi.encodeWithSignature("upgradeTo(address)", _implementation)
        );
        // if (!success) {
        //     // Ensure that the result contains at least 4 bytes (selector + revert reason length)
        //     require(data.length >= 4, "Revert reason not found");

        //     // Skip the first 4 bytes (selector)
        //     assembly {
        //         data := add(data, 0x04)
        //     }

        //     // Decode the revert reason
        //     string memory revertReason = abi.decode(data, (string));

        //     // console.log(revertReason);
        // }
        require(success, "ERROR: external call failed.");
    }

    receive() external payable {}
}
