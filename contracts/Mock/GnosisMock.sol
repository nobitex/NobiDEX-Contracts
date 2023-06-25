// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;


contract GnosisMock  {
     mapping (address => bool) owners;
     constructor(address[] memory _owners){
        for (uint256 i = 0; i < _owners.length; ) {
            owners[_owners[i]] = true;

            unchecked {
                i++;
            }
        }
     }

        function isOwner(address _owner) public view returns (bool) {
        return owners[_owner];
    }
}
