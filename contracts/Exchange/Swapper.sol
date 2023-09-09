//SPDX-License-Identifier: MIT

pragma solidity 0.8.10;

import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/cryptography/SignatureCheckerUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "hardhat/console.sol";


/// @title A trustless off-chain orderbook-based DEX
/// @author nobidex team
/// @notice Only a group of preApproved addresses(brokers) are allowed to Swap assets directly from the contract
/*
 * @dev The Swap is the main function that executes token swaps and fee transactions
 * @dev The Swap function operates with the help of some internal functions:
 * _validateTransaction, _getMessageHash, _isValidSignatureHash.
 */

contract Swapper is
    Initializable,
    UUPSUpgradeable,
    PausableUpgradeable,
    ReentrancyGuardUpgradeable
{
    using SafeERC20Upgradeable for IERC20Upgradeable;

    // State Variables

    /*
     * @dev Moderator is the only address that can call the following functions:
     * updateFeeRatio, unpause, proposeToUpdateModerator.
     */
    address public Moderator;
    address public candidateModerator;
    uint32 public FeeRatioDenominator;
    uint16 public maxFeeRatio;
    uint8 public version;
    // status codes
    // Low Balance Or Allowance ERROR  402 (Payment Required)
    // Cancelled order ERROR 410 (Gone)
    // ValidUntil ERROR  408 (Request Timeout)
    // Fairness ERROR 417 (Precondition Failed)
    // Signature Validation ERROR 401 (Unauthorized)
    // SUCCESSFUL SWAP 200 (OK)
    // https://en.wikipedia.org/wiki/List_of_HTTP_status_codes

    uint16[6] errorCodes ;
    uint16 private constant SUCCESSFUL_SWAP_CODE = 200;

    /// @dev brokersAddresses are the only addresses that are allowed to call the Swap function
    mapping(address => bool) public brokersAddresses;

    mapping(address => bool) private DaoMembers;

    /// @dev orderRevokedStatus mapps the address of the user to one of it's orderIDs to the orders status
    /// @notice when the order status is true the order is considered cancelled
    mapping(address => mapping(uint64 => bool)) public orderRevokedStatus;

    // Structs
    struct MatchedOrders {
        uint16 makerFeeRatio;
        uint16 takerFeeRatio;
        uint64 makerOrderID;
        uint64 takerOrderID;
        uint64 makerValidUntil;
        uint64 takerValidUntil;
        uint256 matchID;
        uint256 makerRatioSellArg;
        uint256 makerRatioBuyArg;
        uint256 takerRatioSellArg;
        uint256 takerRatioBuyArg;
        uint256 makerTotalSellAmount;
        uint256 takerTotalSellAmount;
        address makerSellTokenAddress;
        address takerSellTokenAddress;
        address makerUserAddress;
        address takerUserAddress;
        bytes makerSignature;
        bytes takerSignature;
    }

    struct SwapStatus {
        uint256 matchID;
        uint16 statusCode;
    }

    struct MessageParameters {
        uint16 maxFeeRatio;
        uint64 orderID;
        uint64 validUntil;
        uint256 chainID;
        uint256 ratioSellArg;
        uint256 ratioBuyArg;
        address sellTokenAddress;
        address buyTokenAddress;
    }

    // Events

    /// @dev Emitted when the Swap is called
    event SwapExecuted(SwapStatus[]);

    /// @dev Emitted when the revokeOrder function is called
    event orderCancelled(address, uint64);

    // Modifiers
    modifier isBroker() {
        require(brokersAddresses[msg.sender], "ERROR: unauthorized caller");
        _;
    }

    modifier isModerator() {
        require(msg.sender == Moderator, "ERROR: unauthorized caller");
        _;
    }

    /// @dev isDaoMember, checks to see if the caller is one the listed Moderator
    /// @dev daoMembers are the only addresses that are allowed to call the following functions: registerBrokers, unregisterBrokers, pause
    modifier isDaoMember() {
        require(_isOwner(msg.sender), "ERROR: unauthorized caller");
        _;
    }

    // Constructor and Functions

    /**
     *
     *@dev Sets the values for {MaxFeeRatio} and {Moderator} and {brokersAddresses} mapping.
     *
     */
    function initialize(
        address payable _moderator,
        address[] memory _brokers,
        uint32 _FeeRatioDenominator,
        uint16 _maxFeeRatio,
        uint8 _version
    ) public initializer onlyProxy {
        errorCodes = [402, 410, 408, 417, 401];
        maxFeeRatio = _maxFeeRatio;
        Moderator = _moderator;
        FeeRatioDenominator = _FeeRatioDenominator;
        version = _version;

        for (uint256 i = 0; i < _brokers.length; ) {
            brokersAddresses[_brokers[i]] = true;

            unchecked {
                i++;
            }
        }
    }

    /**
     *
     * @notice Swap function execute the token swaps and fee transactions,
     * @notice Swap function contains multiple fairness and validation checks for each Swap,
     * @notice Swap function checks are for assuring our users that no broker that uses this contract
     * has the ability to abuse their trust,
     *
     *
     * @dev The matchedOrders data must match with the signed order and the signature of the user.
     * @dev SwapExecuted event is emitted with the batchExecuteStatus array that declares the status of each Swap ,
     * @dev batchExecuteStatus array contains the matchId of each Swap and it's statusCode.
     * @dev msg.sender must be a valid Broker,
     *
     * @param matchedOrders is an array of the MatchedOrders struct(which contains the detail of one Swap between two addresses).
     *
     */

    function Swap(
        MatchedOrders[] calldata matchedOrders
    ) external virtual whenNotPaused isBroker nonReentrant onlyProxy {
        SwapStatus[] memory batchExecuteStatus = new SwapStatus[](
            matchedOrders.length
        );

        for (uint256 i = 0; i < matchedOrders.length; i++) {
            MatchedOrders memory matchedOrder = matchedOrders[i];
            bool matchFailed = false;

            (uint256 takerFee, uint256 makerFee) = _calculateTransactionFee(
                matchedOrder
            );

            (
                bool isTransactionFeasible,
                bool isOrderCancelled
            ) = _checkTransactionFeasibility(matchedOrder);

            (
                bool isTransactionExpired,
                bool isSignatureValid
            ) = _checkTransactionValidity(matchedOrder);

            bool isMatchFair = _checkTransactionFairness(matchedOrder);

            bool[5] memory _checksFailConditions = [
                !isTransactionFeasible,
                isOrderCancelled,
                isTransactionExpired,
                !isMatchFair,
                !isSignatureValid
            ];

            for (uint256 j = 0; j < _checksFailConditions.length; j++) {
                if (_checksFailConditions[j]) {
                    batchExecuteStatus[i] = SwapStatus(
                        matchedOrder.matchID,
                        errorCodes[j]
                    );
                    matchFailed = true;
                    break;
                }
            }

            if (matchFailed) {
                continue;
            }

            _swapTokens(matchedOrder, takerFee, makerFee);

            batchExecuteStatus[i] = SwapStatus(
                matchedOrder.matchID,
                SUCCESSFUL_SWAP_CODE
            );
        }
        emit SwapExecuted(batchExecuteStatus);
    }

    /**
     * @notice updateFeeRatio function sets a new uint256 to MaxFeeRatio variable,
     *
     * @dev the new feeRatio cannot be the same as the last one,
     * @dev msg.sender must be the Moderator,
     *
     * @param _newFeeRatio uint256 is the new fee to be set to the maxFeeRatio variable.
     *
     */
    function updateFeeRatio(
        uint16 _newFeeRatio
    ) external whenNotPaused isModerator {
        require(_newFeeRatio != maxFeeRatio, "ERROR: invalid input");
        maxFeeRatio = _newFeeRatio;
    }

    /**
     * @notice registerBrokers function sets an address to True in brokersAddresses mapping, making it a valid caller for Swap function,
     *
     * @dev msg.sender must be a DAO member,
     *
     * @param _brokers address is the address that the DAOMember wants to turn to a broker.
     *
     */
    function registerBrokers(
        address[] memory _brokers
    ) external whenNotPaused isDaoMember {
        for (uint256 i = 0; i < _brokers.length; ) {
            brokersAddresses[_brokers[i]] = true;
            unchecked {
                i++;
            }
        }
    }

    /**
     * @notice unregisterBroker function sets an address to False in brokersAddresses mapping, making it an invalid caller for Swap function,
     *
     * @dev msg.sender must be a DAO member,
     *
     * @param _brokers address is the address that the DAOMember wants to remove from brokers.
     *
     */
    function unregisterBrokers(address[] memory _brokers) external isDaoMember {
        for (uint256 i = 0; i < _brokers.length; ) {
            brokersAddresses[_brokers[i]] = false;
            unchecked {
                i++;
            }
        }
    }

    /**
     * @notice proposeToUpdateModerator function handles suggesting the update of the Moderator address,
     * this suggestion will be reviewed by DAOmembers and after the appropriate approvals in the Moderator contract,
     * the proposed address is assigned to the candidateModerator variables,
     *
     * @notice proposeToUpdateModerator function is for the time it is decided decide to change the contracts proxy,
     *
     * @dev the new Moderator address cannot be the same as the last one,
     * @dev msg.sender must be the previous Moderator contract,
     *
     * @param _newModerator address is the new candidate for Moderator variable.
     *
     */
    function proposeToUpdateModerator(
        address _newModerator
    ) external isModerator {
        require(candidateModerator != _newModerator, "ERROR: already proposed");
        candidateModerator = _newModerator;
    }

    /**
     * @notice updateModerator function handle the update of the Moderator variable,
     *
     * @dev msg.sender must be the new Moderator contract address,
     *
     */
    function updateModerator() external {
        require(candidateModerator == msg.sender, "ERROR: invalid sender");

        Moderator = candidateModerator;
        candidateModerator = address(0);
    }

    /**
     * @notice revokeOrder function sets the status of the msg.senders order to true in isOrderCanceled mapping,
     *
     * @notice revokeOrder function gives the users the ability to manage their orders on-chain in addition to managing
     * them off-chain through the dex itself,
     *
     * @dev orderCancelled event is emitted with the msg.sender(users address) and the users orderID the wish to cancel,
     * @param _messageParameters is the ID of the order the user wish to cancel.
     *
     */

    function revokeOrder(
        MessageParameters memory _messageParameters,
        bytes memory _signature
    ) external whenNotPaused {
        uint64 orderID = _messageParameters.orderID;
        bytes32 makerMsgHash = _getMessageHash(_messageParameters);
        bool isMakerSignatureValid = _isValidSignatureHash(
            msg.sender,
            makerMsgHash,
            _signature
        );
        require(isMakerSignatureValid, "ERROR: invalid signature");
        bool orderStatus = orderRevokedStatus[msg.sender][orderID];
        require(!orderStatus, "ERROR: already cancelled");
        orderRevokedStatus[msg.sender][orderID] = true;
        emit orderCancelled(msg.sender, orderID);
    }

    // pause and unpause functions

    /**
     * @notice pause function, transfers all the given tokens balances and the Ether (if the contract have any Ether balance) to the Moderator contract and triggers  the stopped state,
     *
     * @dev Paused event is emitted with the list of tokens,
     * @dev EthTransferStatus is emitted if there is any Eth in the contract with the transfer results,
     * @dev msg.sender must be the Moderator member,
     *
     * @param tokenAddresses is the token list to be transferred to the Moderator contract,
     *
     */
    function pause(
        address[] memory tokenAddresses
    ) external whenNotPaused isDaoMember nonReentrant {
        uint256 len = tokenAddresses.length;

        for (uint256 i = 0; i < len; ) {
            if (tokenAddresses[i] == address(0)) {
                uint256 EthBalance = address(this).balance;
                payable(Moderator).transfer(EthBalance);
            } else {
                uint256 balance = IERC20Upgradeable(tokenAddresses[i])
                    .balanceOf(address(this));
                IERC20Upgradeable(tokenAddresses[i]).safeTransfer(
                    Moderator,
                    balance
                );
            }

            unchecked {
                i++;
            }
        }
        _pause();
    }

    /**
     * @notice unpause function, Returns the contract to normal state after it has been paused,
     *
     * @dev msg.sender must be the Moderator,
     */
    function unpause() external whenPaused isModerator {
        _unpause();
    }

    //getter functions

    /**
     * @dev Retrieves the chain ID of the current blockchain.
     * @return The chain ID as a uint256 value.
     */
    function getChainID() public view returns (uint256) {
        return block.chainid;
    }

    /**
     * @dev Retrieves the current block number within the blockchain.
     * @return The block number as a uint256 value.
     */

    function getBlockNumber() public view returns (uint256) {
        return block.number;
    }

    /**
     * @dev _checkTransactionFeasibility function checks the Transaction Feasibility and if the Transaction cancelled returning the result as booleans.
     * @dev since the function is internal, the data will later be used in the swap function to validate each swap.

     * @param _matchedOrder is the data of each swap,
     *
     */

    function _checkTransactionFeasibility(
        MatchedOrders memory _matchedOrder
    ) internal view returns (bool, bool) {
        //Transaction Feasibility
        bool isTransactionFeasible = _ValidateTransaction(
            _matchedOrder.makerUserAddress,
            _matchedOrder.makerSellTokenAddress,
            _matchedOrder.makerTotalSellAmount
        ) &&
            _ValidateTransaction(
                _matchedOrder.takerUserAddress,
                _matchedOrder.takerSellTokenAddress,
                _matchedOrder.takerTotalSellAmount
            );

        //Transaction cancelled
        bool isOrderCancelled = orderRevokedStatus[
            _matchedOrder.makerUserAddress
        ][_matchedOrder.makerOrderID] ||
            orderRevokedStatus[_matchedOrder.takerUserAddress][
                _matchedOrder.takerOrderID
            ];

        return (isTransactionFeasible, isOrderCancelled);
    }

    /**
     * @dev _checkTransactionValidity function checks the Transactions valid until and  the Transfer amount validity and the signature validity, returning the result as booleans.
     * @dev since the function is internal, the data will later be used in the swap function to validate each swap.

     * @param _matchedOrder is the data of each swap,
     *
     */
    function _checkTransactionValidity(
        MatchedOrders memory _matchedOrder
    ) internal view returns (bool, bool) {
        uint256 chainID = block.chainid;

        //Transaction validity
        bool isTransactionExpired = (_matchedOrder.makerValidUntil <
            block.number) || (_matchedOrder.takerValidUntil < block.number);

        //signature validity
        bytes32 makerMsgHash = _getMessageHash(
            MessageParameters(
                maxFeeRatio,
                _matchedOrder.makerOrderID,
                _matchedOrder.makerValidUntil,
                chainID,
                _matchedOrder.makerRatioSellArg,
                _matchedOrder.makerRatioBuyArg,
                _matchedOrder.makerSellTokenAddress,
                _matchedOrder.takerSellTokenAddress
            )
        );

        bytes32 takerMsgHash = _getMessageHash(
            MessageParameters(
                maxFeeRatio,
                _matchedOrder.takerOrderID,
                _matchedOrder.takerValidUntil,
                chainID,
                _matchedOrder.takerRatioSellArg,
                _matchedOrder.takerRatioBuyArg,
                _matchedOrder.takerSellTokenAddress,
                _matchedOrder.makerSellTokenAddress
            )
        );

        bool isMakerSignatureValid = _isValidSignatureHash(
            _matchedOrder.makerUserAddress,
            makerMsgHash,
            _matchedOrder.makerSignature
        );

        bool isTakerSignatureValid = _isValidSignatureHash(
            _matchedOrder.takerUserAddress,
            takerMsgHash,
            _matchedOrder.takerSignature
        );

        bool isSignatureValid = (isMakerSignatureValid &&
            isTakerSignatureValid);

        return (isTransactionExpired, isSignatureValid);
    }

    /**
     * @dev _checkTransactionFairness function checks the price and fee fairness and the relativity of the swap amounts toward each other as maker and taker, returning the result as boolians.
     * @dev since the function is internal, the data will later be used in the swap function to validate each swap.

     * @param _matchedOrder is the data of each swap,
     *
     */
    function _checkTransactionFairness(
        MatchedOrders memory _matchedOrder
    ) internal view returns (bool) {
        bool isPriceFair = (_matchedOrder.makerTotalSellAmount *
            _matchedOrder.makerRatioBuyArg) ==
            (_matchedOrder.makerRatioSellArg *
                _matchedOrder.takerTotalSellAmount);

        bool isPriceRelative = (_matchedOrder.makerRatioSellArg *
            _matchedOrder.takerRatioSellArg) >=
            (_matchedOrder.makerRatioBuyArg * _matchedOrder.takerRatioBuyArg);

        bool isFeeFairness = (_matchedOrder.makerFeeRatio <= maxFeeRatio) &&
            (_matchedOrder.takerFeeRatio <= maxFeeRatio);

        return (isPriceFair && isPriceRelative && isFeeFairness);
    }

    /**
     * @dev _calculateTransactionFee function calculates each users fee amount according to the fee ratio assigned to them.
     * @dev since the function is internal, the data will later be used in the swap function to make the transfers.

     * @param _matchedOrder is the data of each swap,
     *
     */

    function _calculateTransactionFee(
        MatchedOrders memory _matchedOrder
    ) internal view whenNotPaused returns (uint256, uint256) {
        uint256 takerFee = (_matchedOrder.makerTotalSellAmount *
            _matchedOrder.takerFeeRatio) / FeeRatioDenominator;
        uint256 makerFee = (_matchedOrder.takerTotalSellAmount *
            _matchedOrder.makerFeeRatio) / FeeRatioDenominator;
        return (takerFee, makerFee);
    }

    /**
     * @dev _swapTokens function swaps the transfer amounts to each user and the fee to the Moderator.
     * @dev since the function is internal, it will later be used in the swap function to make the transfers.

     * @param _matchedOrder is the data of each swap,
     *
     */

    function _swapTokens(
        MatchedOrders memory _matchedOrder,
        uint256 _takerFee,
        uint256 _makerFee
    ) internal {
        IERC20Upgradeable(_matchedOrder.makerSellTokenAddress).safeTransferFrom(
                _matchedOrder.makerUserAddress,
                _matchedOrder.takerUserAddress,
                _matchedOrder.makerTotalSellAmount - _takerFee
            );
        IERC20Upgradeable(_matchedOrder.takerSellTokenAddress).safeTransferFrom(
                _matchedOrder.takerUserAddress,
                _matchedOrder.makerUserAddress,
                _matchedOrder.takerTotalSellAmount - _makerFee
            );

        IERC20Upgradeable(_matchedOrder.makerSellTokenAddress).safeTransferFrom(
                _matchedOrder.makerUserAddress,
                Moderator,
                _takerFee
            );
        IERC20Upgradeable(_matchedOrder.takerSellTokenAddress).safeTransferFrom(
                _matchedOrder.takerUserAddress,
                Moderator,
                _makerFee
            );
    }

    /**
     * @dev _isDao function validates the users signature is one of the owners of the Moderator contract,
     * with an external call to the "Moderator" contract,
     *
     * @param _caller is the address of the msg.sender in the isDaoMember modifier,
     *
     */

    function _isOwner(address _caller) internal returns (bool) {
        (bool success, bytes memory data) = Moderator.call(
            abi.encodeWithSignature("isOwner(address)", _caller)
        );
        require(success, "ERROR: external call failed");
        return abi.decode(data, (bool));
    }

    /**
     * @dev _isValidSignatureHash function validates the users signature against the created message hash,
     * with an external call to the "SignatureChecker" contract,
     *
     * @param _userAddress is the address of the user whose signature is being validated,
     * @param _messageHash is the hash of the data user signed previously,
     * @param _userSignature is the signature from when the user placed their order.
     *
     */
    function _isValidSignatureHash(
        address _userAddress,
        bytes32 _messageHash,
        bytes memory _userSignature
    ) internal view returns (bool) {
        return
            SignatureCheckerUpgradeable.isValidSignatureNow(
                _userAddress,
                _messageHash,
                _userSignature
            );
    }

    /**
     * @notice _getMessageHashFunction hashes the data that user signed when they placed the order for further validation,
     *
     * @dev _getMessageHash function is used in th execute Swap to hash the given Swap data,
     *
     *
     * @param _messageParameters(MessageParameters struct) contains the data that a user signed while placing on order.
     *
     */
    function _getMessageHash(
        MessageParameters memory _messageParameters
    ) internal pure returns (bytes32) {
        bytes32 hash = keccak256(
            abi.encodePacked(
                _messageParameters.maxFeeRatio,
                _messageParameters.orderID,
                _messageParameters.validUntil,
                _messageParameters.chainID,
                _messageParameters.ratioSellArg,
                _messageParameters.ratioBuyArg,
                _messageParameters.sellTokenAddress,
                _messageParameters.buyTokenAddress
            )
        );
        return
            keccak256(
                abi.encodePacked("\x19Ethereum Signed Message:\n32", hash)
            );
    }

    /**
     * @dev _ValidateTransaction function compares the users balance and allowance against the amounts required for the Swap to be executed,
     * to check if the transaction is possible.
     *
     * @param _userAddress is the address of the user,
     * @param _userSellToken is the address of the token that user is selling,
     * @param _userSellAmount is total amount of token that user is selling.
     *
     *@return A boolean dictating if the Swap execution is possible or it is going to fail due to lack of balance or allowance.
     */
    function _ValidateTransaction(
        address _userAddress,
        address _userSellToken,
        uint256 _userSellAmount
    ) internal view returns (bool) {
        bool isTransactionValid;
        uint256 userBalance = IERC20Upgradeable(_userSellToken).balanceOf(
            _userAddress
        );
        uint256 userAllowance = IERC20Upgradeable(_userSellToken).allowance(
            _userAddress,
            address(this)
        );
        if (
            (userBalance >= _userSellAmount) &&
            (userAllowance >= _userSellAmount)
        ) {
            isTransactionValid = true;
        } else {
            isTransactionValid = false;
        }
        return isTransactionValid;
    }

    function _authorizeUpgrade(
        address _newImplementation
    ) internal override isModerator {
        require(
            _newImplementation != address(0),
            "ERROR: upgrade to zero address"
        );
     
    }
}
