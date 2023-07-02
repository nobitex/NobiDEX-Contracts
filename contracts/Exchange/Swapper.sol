//SPDX-License-Identifier: MIT

pragma solidity 0.8.10;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import '@openzeppelin/contracts/security/Pausable.sol';
import '@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol';
import '@openzeppelin/contracts/security/ReentrancyGuard.sol';
import 'hardhat/console.sol';

/// @title A trustless offchain orderbook-based DEX
/// @author nobidex team
/// @notice Only a group of preApproved addresses(brokers) are allowed to Swap assets directly from the contract
/*
 * @dev The Swap is the main function that executes token swaps and fee transactions
 * @dev The Swap function operates with the help of some internal functions:
 * _validateTransaction, _getMessageHash, _isValidSignatureHash.
 */

contract swapper is Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // State Variables

    /*
     * @dev Admin is the only address that can call the following functions:
     * updateFeeRatio, unpause, proposeToUpdateAdmin.
     */
    address public Admin;
    address public candidateAdmin;
    uint16 public maxFeeRatio;
    uint16[8] errorCodes = [402, 410, 408, 412, 417, 409, 401, 406];

    // status codes
    // Low Balance Or Allowance ERROR  402 (Payment Required)
    // Cancelled order ERROR 410 (Gone)
    // ValidUntil ERROR  408 (Request Timeout)
    // Price Fairness ERROR 412 (Precondition Failed)
    // Price Relation ERROR 417 (Expectation Failed)
    // Fee Fairness ERROR  409 (Conflict)
    // Signature Validation ERROR 401 (Unauthorized)
    // Zero transfer amount ERROR (Not Acceptable)
    // SUCCESSFUL SWAP 200 (OK)
    // https://en.wikipedia.org/wiki/List_of_HTTP_status_codes

    // uint16 private constant LOW_BALANCE_OR_LOW_ALLOWANCE_ERROR_CODE = 402;
    // uint16 private constant CANCELED_ORDER_ERROR_CODE = 410;
    // uint16 private constant VALID_UNTIL_ERROR_CODE = 408;
    // uint16 private constant PRICE_FAIRNESS_ERROR_CODE = 412;
    // uint16 private constant PRICE_RELATION_ERROR_CODE = 417;
    // uint16 private constant FEE_FAIRNESS_ERROR_CODE = 409;
    // uint16 private constant SIGNATURE_VALIDATION_ERROR_CODE = 401;
    // uint16 private constant ZERO_TRANSFER_AMOUNT_ERROR_CODE = 406;
    uint16 private constant SUCCESSFUL_SWAP_CODE = 200;

    /// @dev brokersAddresses are the only addresses that are allowed to call the Swap function
    mapping(address => bool) public brokersAddresses;

    mapping(address => bool) private DaoMembers;

    /// @dev orderStatus mapps the address of the user to one of it's orderIDs to the orders status
    /// @notice when the order status is true the order is considered cancelled
    mapping(address => mapping(uint64 => bool)) public orderCanceledStatus;

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

    struct CancelOrderData {
        address userAddress;
        uint56 orderID;
    }

    struct cancleOrderData {
        bytes32 hash;
        bytes signature;
        uint64 orderID;
    }

    // Events

    /// @dev Emitted when the Swap is called
    event SwapExecuted(SwapStatus[]);

    /// @dev Emitted when the Pause function is called
    event transferredAssets(address[]);
    event EthTransferStatus(bool);

    /// @dev Emitted when the removeOrder function is called
    event orderCancelled(address, uint64);

    // Modifiers

    modifier isBroker() {
        require(brokersAddresses[msg.sender], 'ERROR: unauthorized caller');
        _;
    }

    modifier isAdmin() {
        require(msg.sender == Admin, 'ERROR: unauthorized caller');
        _;
    }

    /// @dev isDaoMember, checks to see if the caller is one the listed DAOmembers of the Admin
    /// @dev daoMembers are the only addresses that are allowed to call the following functions: registerBroker, unregisterBroker, pause
    modifier isDaoMember() {
        require(_isOwner(msg.sender), 'ERROR: unauthorized caller');
        _;
    }

    // Constructor and Functions

    /**
     *
     *@dev Sets the values for {MaxFeeRatio} and {Admin} and {brokersAddresses} mapping.
     *
     */
    constructor(uint16 feeRatio, address payable _Admin, address[] memory _brokers) {
        maxFeeRatio = feeRatio;
        Admin = _Admin;

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
     * has the abaility to abuse their trust,
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

    function Swap(MatchedOrders[] calldata matchedOrders) external virtual whenNotPaused isBroker nonReentrant {
        uint256 len = matchedOrders.length;
        SwapStatus[] memory batchExecuteStatus = new SwapStatus[](len);
        bool matchCanceled;

        for (uint256 i = 0; i < len; i++) {
            MatchedOrders memory matchedOrder = matchedOrders[i];

            (bool isTransactionFeasible, bool isOrderCancelleded) = _checkTransactionFeasiblity(matchedOrder);
            (bool isTransactionExpired, bool isSignatureValid, bool isValueZero) = _checkTransactionValidity(
                matchedOrder
            );
            (bool isPriceFair, bool isPriceRelative, bool isFeeFairness) = _checkTransactoinFairness(matchedOrder);

            bool[8] memory _checks = [
                !isTransactionFeasible,
                isOrderCancelleded,
                isTransactionExpired,
                !isPriceFair,
                !isPriceRelative,
                !isFeeFairness,
                !isSignatureValid,
                isValueZero
            ];

            for (uint256 j = 0; j < _checks.length; j++) {
                if (_checks[j]) {
                    batchExecuteStatus[i] = SwapStatus(matchedOrder.matchID, errorCodes[j]);
                    matchCanceled = true;
                    break;
                }
            }

            if (matchCanceled) {
                continue;
            }

            _swapTokens(matchedOrder);

            batchExecuteStatus[i] = SwapStatus(matchedOrder.matchID, SUCCESSFUL_SWAP_CODE);
        }
        emit SwapExecuted(batchExecuteStatus);
    }

    /**
     * @notice updateFeeRatio function sets a new uint256 to MaxFeeRatio variable,
     *
     * @dev the new feeRatio cannot be the same as the last one,
     * @dev msg.sender must be the Admin,
     *
     * @param _newFeeRatio uint256 is the new fee to be set to the maxFeeRatio variable.
     *
     */
    function updateFeeRatio(uint16 _newFeeRatio) external whenNotPaused isAdmin {
        require(_newFeeRatio != maxFeeRatio, 'ERROR: invalid input');
        maxFeeRatio = _newFeeRatio;
    }

    /**
     * @notice registerBroker function sets an address to True in brokersAddresses mapping, making it a valid caller for Swap function,
     *
     * @dev msg.sender must be a DAO member,
     *
     * @param _brokers address is the address that the DAOMember wants to turn to a broker.
     *
     */
    function registerBroker(address[] memory _brokers) external whenNotPaused isDaoMember {
        for (uint256 i = 0; i < _brokers.length; ) {
            brokersAddresses[_brokers[i]] = true;
            unchecked {
                i++;
            }
        }
    }

    /**
     * @notice unregisterBroker function sets an address to False in brokersAddresses mapping, making it an unvalid caller for Swap function,
     *
     * @dev msg.sender must be a DAO member,
     *
     * @param _brokers address is the address that the DAOMember wants to remove from brokers.
     *
     */
    function unregisterBroker(address[] memory _brokers) external isDaoMember {
        for (uint256 i = 0; i < _brokers.length; ) {
            brokersAddresses[_brokers[i]] = false;
            unchecked {
                i++;
            }
        }
    }

    /**
     * @notice updateAdmin function handle the update of the Admin variable,
     *
     * @dev msg.sender must be the new Admin contract address,
     *
     */
    function updateAdmin() external whenNotPaused {
        require(candidateAdmin == msg.sender, 'ERROR: invalid sender');

        Admin = candidateAdmin;
        candidateAdmin = address(0);
    }

    /**
     * @notice proposeToUpdateAdmin function handles suggesting the update of the Admin address,
     * this suggestion will be reviewed by DAOmembers and after the appropriate approvals in the Admin contract,
     * the proposed address is assigned to the candidateAdmin variables,
     *
     * @notice proposeToUpdateAdmin function is for the time it is decided decide to change the contracts proxy,
     *
     * @dev the new Admin address cannot be the same as the last one,
     * @dev msg.sender must be the previous Admin contract,
     *
     * @param _newAdmin address is the new candidate for Admin variable.
     *
     */
    function proposeToUpdateAdmin(address _newAdmin) external whenNotPaused isAdmin {
        require(candidateAdmin != _newAdmin, 'ERROR: already proposed');
        candidateAdmin = _newAdmin;
    }

    /**
     * @notice removeOrder function sets the status of the msg.senders order to true in isOrderCanceled mapping,
     *
     * @notice removeOrder function gives the users the ability to manage their orders on-chain in addition to managing
     * them off-chain through the dex itself,
     *
     * @dev orderCancelled event is emitted with the msg.sender(users address) and the users orderID the wish to cancel,
     * @param _MessageParameters is the ID of the order the user wish to cancel.
     *
     */
    function removeOrder(
        MessageParameters memory _MessageParameters,
        bytes memory _signature,
        uint64 _orderID
    ) external whenNotPaused {
        bytes32 makerMsgHash = _getMessageHash(_MessageParameters);
        bool isMakerSignatureValid = _isValidSignatureHash(msg.sender, makerMsgHash, _signature);
        require(isMakerSignatureValid, 'ERROR: invalid signature');
        bool orderStatus = orderCanceledStatus[msg.sender][_orderID];
        require(!orderStatus, 'ERROR: already cancelled');
        orderCanceledStatus[msg.sender][_orderID] = true;
        emit orderCancelled(msg.sender, _orderID);
    }


    // pause and unpause functions

    /**
     * @notice pause function, transfers all the given tokens balances and the Ether (if the contract have any Ether balance) to the Admin contract and triggers  the stopped state,
     *
     * @dev Paused event is emitted with the list of tokens,
     * @dev EthTransferStatus is emmited if there is any Eth in the contract with the transfer results,
     * @dev msg.sender must be the Admin member,
     *
     * @param tokenAddresses is the token list to be transferred to the Admin contract,
     *
     */
    function pause(address[] memory tokenAddresses) external whenNotPaused isDaoMember nonReentrant {
        uint256 len = tokenAddresses.length;
        uint256 EthBalance = address(this).balance;

        for (uint256 i = 0; i < len; ) {
            if ((tokenAddresses[i] == address(0)) && (EthBalance > 0)) {
                bool success = payable(Admin).send(EthBalance);

                emit EthTransferStatus(success);
                unchecked {
                    i++;
                }
                continue;
            }

            uint256 balance = IERC20(tokenAddresses[i]).balanceOf(address(this));
            IERC20(tokenAddresses[i]).safeTransfer(Admin, balance);

            unchecked {
                i++;
            }
        }
        _pause();
        emit transferredAssets(tokenAddresses);
    }

    /**
     * @notice unpause function, Returns the contract to normal state after it has been paused,
     *
     * @dev msg.sender must be the Admin,
     */
    function unpause() external whenPaused isAdmin {
        _unpause();
    }

    function _checkTransactionFeasiblity(
        MatchedOrders memory _matchedOrder
    ) internal view whenNotPaused returns (bool, bool) {
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
        bool isOrderCancelleded = orderCanceledStatus[_matchedOrder.makerUserAddress][_matchedOrder.makerOrderID] ||
            orderCanceledStatus[_matchedOrder.takerUserAddress][_matchedOrder.takerOrderID];
        return (isTransactionFeasible, isOrderCancelleded);
    }

    function _checkTransactionValidity(
        MatchedOrders memory _matchedOrder
    ) internal view whenNotPaused returns (bool, bool, bool) {
        uint256 chainID = block.chainid;
        (uint256 takerFee, uint256 makerFee) = _calculateTransactionFee(_matchedOrder);
        bool isTransactionExpired = (_matchedOrder.makerValidUntil < block.number) ||
            (_matchedOrder.takerValidUntil < block.number);
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

        bool isSignatureValid = (isMakerSignatureValid && isTakerSignatureValid);

        //zero check

        bool isValueZero = (_matchedOrder.makerTotalSellAmount - takerFee == 0 ||
            _matchedOrder.takerTotalSellAmount - makerFee == 0 ||
            takerFee == 0 ||
            makerFee == 0);
        return (isTransactionExpired, isSignatureValid, isValueZero);
    }

    function _checkTransactoinFairness(
        MatchedOrders memory _matchedOrder
    ) internal view whenNotPaused returns (bool, bool, bool) {
        bool isPriceFair = (_matchedOrder.makerTotalSellAmount * _matchedOrder.makerRatioBuyArg) ==
            (_matchedOrder.makerRatioSellArg * _matchedOrder.takerTotalSellAmount);

        bool isPriceRelative = (_matchedOrder.makerRatioSellArg * _matchedOrder.takerRatioSellArg) >=
            (_matchedOrder.makerRatioBuyArg * _matchedOrder.takerRatioBuyArg);

        bool isFeeFairness = (_matchedOrder.makerFeeRatio <= maxFeeRatio) &&
            (_matchedOrder.takerFeeRatio <= maxFeeRatio);

        return (isPriceFair, isPriceRelative, isFeeFairness);
    }

    function _calculateTransactionFee(
        MatchedOrders memory _matchedOrder
    ) internal view whenNotPaused returns (uint256, uint256) {
        uint256 takerFee = (_matchedOrder.makerTotalSellAmount * _matchedOrder.takerFeeRatio) / 1000;
        uint256 makerFee = (_matchedOrder.takerTotalSellAmount * _matchedOrder.makerFeeRatio) / 1000;
        return (takerFee, makerFee);
    }

    function _swapTokens(MatchedOrders memory _matchedOrder) internal whenNotPaused {
        (uint256 takerFee, uint256 makerFee) = _calculateTransactionFee(_matchedOrder);
        IERC20(_matchedOrder.makerSellTokenAddress).safeTransferFrom(
            _matchedOrder.makerUserAddress,
            _matchedOrder.takerUserAddress,
            _matchedOrder.makerTotalSellAmount - takerFee
        );
        IERC20(_matchedOrder.takerSellTokenAddress).safeTransferFrom(
            _matchedOrder.takerUserAddress,
            _matchedOrder.makerUserAddress,
            _matchedOrder.takerTotalSellAmount - makerFee
        );

        IERC20(_matchedOrder.makerSellTokenAddress).safeTransferFrom(_matchedOrder.makerUserAddress, Admin, takerFee);
        IERC20(_matchedOrder.takerSellTokenAddress).safeTransferFrom(_matchedOrder.takerUserAddress, Admin, makerFee);
    }

    /**
     * @dev _isDao function validates the users signature is one of the owners of the admin contract,
     * with an external call to the "Admin" contract,
     *
     * @param _caller is the address of the msg.sender in the isDaoMember modifier,
     *
     */

    function _isOwner(address _caller) internal returns (bool) {
        (bool success, bytes memory data) = Admin.call(abi.encodeWithSignature('isOwner(address)', _caller));
        require(success, 'ERROR: external call failed');
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
        return SignatureChecker.isValidSignatureNow(_userAddress, _messageHash, _userSignature);
    }

    /**
     * @notice _getMessageHashfunction hashes the data that user signed when they placed the order for further validation,
     *
     * @dev _getMessageHash function is used in th execute Swap to hash the given Swap data,
     *
     *
     * @param _messageParameters(MessageParameters struct) contains the data that a user signed while placing on order.
     *
     */
    function _getMessageHash(MessageParameters memory _messageParameters) internal pure returns (bytes32) {
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
        return keccak256(abi.encodePacked('\x19Ethereum Signed Message:\n32', hash));
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
        uint256 userBalance = IERC20(_userSellToken).balanceOf(_userAddress);
        uint256 userAllowance = IERC20(_userSellToken).allowance(_userAddress, address(this));
        if ((userBalance >= _userSellAmount) && (userAllowance >= _userSellAmount)) {
            isTransactionValid = true;
        } else {
            isTransactionValid = false;
        }
        return isTransactionValid;
    }
}
