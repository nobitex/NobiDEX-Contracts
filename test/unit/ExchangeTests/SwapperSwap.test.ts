import { expect } from "chai";
import { Contract, ethers } from "ethers";
import hre from "hardhat";
import {
  deployContracts,
  getAccounts,
  transferSomeTokens,
  createMsgHash,
  deployGnosisContract,
} from "../../Utils.test";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

describe("swapper", function () {
  let gnosis: Contract,
    token1: Contract,
    token2: Contract,
    token3: Contract,
    token4: Contract,
    deployer: SignerWithAddress,
    daoMember1: SignerWithAddress,
    daoMember2: SignerWithAddress,
    daoMember3: SignerWithAddress,
    daoMember4: SignerWithAddress,
    daoMember5: SignerWithAddress,
    daoMember6: SignerWithAddress,
    proxy: ethers.Contract,
    provider: ethers.providers.JsonRpcProvider,
    maxFeeRatio: number,
    chainID: number;

  beforeEach(async function () {
    gnosis = (await deployGnosisContract()).gnosis;
    proxy = (await deployContracts(gnosis.address)).proxy;
    token1 = (await deployContracts(gnosis.address)).token1;
    token2 = (await deployContracts(gnosis.address)).token2;
    token3 = (await deployContracts(gnosis.address)).token3;
    token4 = (await deployContracts(gnosis.address)).token4;
    deployer = (await getAccounts()).deployer;
    daoMember1 = (await getAccounts()).daoMember1;
    daoMember2 = (await getAccounts()).daoMember2;
    daoMember3 = (await getAccounts()).daoMember3;
    daoMember4 = (await getAccounts()).daoMember4;
    daoMember5 = (await getAccounts()).daoMember5;
    daoMember6 = (await getAccounts()).daoMember6;
    provider = hre.ethers.provider;
    await provider.ready;
    // contract variables
     maxFeeRatio = await proxy.maxFeeRatio();
     const network = await provider.getNetwork();
     chainID = network.chainId;
  });
  describe("`Swap` Functionality", async function () {
    it("should emit TranactionCreated events", async function () {
      //executeSwap functions input(orders)

      const MatchedOrders = [
        {
          //successful order
          makerFeeRatio: 10,
          takerFeeRatio: 20,
          makerOrderID: 2356,
          takerOrderID: 3154,
          makerValidUntil: 1000,
          takerValidUntil: 1000,
          matchID: 1,
          makerRatioSellArg: 3n * 10n ** 18n,
          makerRatioBuyArg: 600n * 10n ** 18n,
          takerRatioSellArg: 650n * 10n ** 18n,
          takerRatioBuyArg: 3n * 10n ** 18n,
          makerTotalSellAmount: 1n * 10n ** 18n,
          takerTotalSellAmount: 200n * 10n ** 18n,
          makerSellTokenAddress: token3.address,
          takerSellTokenAddress: token4.address,
          makerUserAddress: daoMember3.address,
          takerUserAddress: daoMember4.address,
        },
        {
          //order with no balance or allowance
          makerFeeRatio: 10,
          takerFeeRatio: 20,
          makerOrderID: 2546,
          takerOrderID: 128,
          makerValidUntil: 1000,
          takerValidUntil: 1000,
          matchID: 2,
          makerRatioSellArg: 1 * 10 ** 10,
          makerRatioBuyArg: 1000 * 10 ** 6,
          takerRatioSellArg: 1200 * 10 ** 6,
          takerRatioBuyArg: 1 * 10 ** 10,
          makerTotalSellAmount: 5 * 10 ** 10,
          takerTotalSellAmount: 5000 * 10 ** 6,
          makerSellTokenAddress: token1.address,
          takerSellTokenAddress: token2.address,
          makerUserAddress: daoMember1.address,
          takerUserAddress: daoMember5.address,
          makerSignature: "",
          takerSignature: "",
        },
        {
          // order with the fee ratio > maxFeeRatio
          makerFeeRatio: 10,
          takerFeeRatio: 21,
          makerOrderID: 6954,
          takerOrderID: 368,
          makerValidUntil: 1000,
          takerValidUntil: 1000,
          matchID: 3,
          makerRatioSellArg: 3 * 10 ** 10,
          makerRatioBuyArg: 600 * 10 ** 10,
          takerRatioSellArg: 650 * 10 ** 10,
          takerRatioBuyArg: 3 * 10 ** 10,
          makerTotalSellAmount: 1 * 10 ** 10,
          takerTotalSellAmount: 200 * 10 ** 10,
          makerSellTokenAddress: token3.address,
          takerSellTokenAddress: token4.address,
          makerUserAddress: daoMember3.address,
          takerUserAddress: daoMember4.address,
          makerSignature: "",
          takerSignature: "",
        },
        {
          //order with the mixed up price ratios
          makerFeeRatio: 10,
          takerFeeRatio: 20,
          makerOrderID: 9425,
          takerOrderID: 32,
          makerValidUntil: 1000,
          takerValidUntil: 1000,
          matchID: 4,
          makerRatioSellArg: 3 * 10 ** 10,
          makerRatioBuyArg: 600 * 10 ** 10,
          takerRatioSellArg: 3 * 10 ** 10,
          takerRatioBuyArg: 650 * 10 ** 10,
          makerTotalSellAmount: 1 * 10 ** 10,
          takerTotalSellAmount: 200 * 10 ** 10,
          makerSellTokenAddress: token3.address,
          takerSellTokenAddress: token4.address,
          makerUserAddress: daoMember3.address,
          takerUserAddress: daoMember4.address,
        },
        {
          //order with the mixeds up amout ratios
          makerFeeRatio: 10,
          takerFeeRatio: 20,
          makerOrderID: 7823,
          takerOrderID: 1469,
          makerValidUntil: 1000,
          takerValidUntil: 1000,
          matchID: 5,
          makerRatioSellArg: 600 * 10 ** 10,
          makerRatioBuyArg: 3 * 10 ** 10,
          takerRatioSellArg: 650 * 10 ** 10,
          takerRatioBuyArg: 3 * 10 ** 10,
          makerTotalSellAmount: 1 * 10 ** 10,
          takerTotalSellAmount: 200 * 10 ** 10,
          makerSellTokenAddress: token3.address,
          takerSellTokenAddress: token4.address,
          makerUserAddress: daoMember3.address,
          takerUserAddress: daoMember4.address,
        },
        {
          //expired errors
          makerFeeRatio: 10,
          takerFeeRatio: 20,
          makerOrderID: 2514,
          takerOrderID: 2379,
          makerValidUntil: 9,
          takerValidUntil: 5,
          matchID: 6,
          makerRatioSellArg: 3 * 10 ** 10,
          makerRatioBuyArg: 600 * 10 ** 10,
          takerRatioSellArg: 650 * 10 ** 10,
          takerRatioBuyArg: 3 * 10 ** 10,
          makerTotalSellAmount: 1 * 10 ** 10,
          takerTotalSellAmount: 200 * 10 ** 10,
          makerSellTokenAddress: token3.address,
          takerSellTokenAddress: token4.address,
          makerUserAddress: daoMember3.address,
          takerUserAddress: daoMember4.address,
        },
        {
          //successful order
          makerFeeRatio: 10,
          takerFeeRatio: 20,
          makerOrderID: 2356,
          takerOrderID: 3154,
          makerValidUntil: 1000,
          takerValidUntil: 1000,
          matchID: 7,
          makerRatioSellArg: 3n * 10n ** 18n,
          makerRatioBuyArg: 600n * 10n ** 18n,
          takerRatioSellArg: 650n * 10n ** 18n,
          takerRatioBuyArg: 3n * 10n ** 18n,
          makerTotalSellAmount: 56,
          takerTotalSellAmount: 0,
          makerSellTokenAddress: token3.address,
          takerSellTokenAddress: token4.address,
          makerUserAddress: daoMember3.address,
          takerUserAddress: daoMember4.address,
        },
      ];

      //create msg hashesh and adding them to the input data
      await createMsgHash(MatchedOrders);

      // base transfers
      const _amounts = [
        ethers.BigNumber.from(1000n * 10n ** 18n),
        ethers.BigNumber.from(1000n * 10n ** 18n),
        ethers.BigNumber.from(1000n * 10n ** 18n),
        ethers.BigNumber.from(1000n * 10n ** 18n),
      ];
      const _tokens = [token1, token2, token3, token4];

      const _callers = [daoMember1, daoMember2, daoMember3, daoMember4];

      await transferSomeTokens(_tokens, _amounts, _callers);

      // base allowances
      await token1
        .connect(daoMember1)
        .increaseAllowance(proxy.address, 1000n * 10n ** 18n);
      await token2
        .connect(daoMember2)
        .increaseAllowance(proxy.address, 1000n * 10n ** 18n);
      await token3
        .connect(daoMember3)
        .increaseAllowance(proxy.address, 1000n * 10n ** 18n);
      await token4
        .connect(daoMember4)
        .increaseAllowance(proxy.address, 1000n * 10n ** 18n);

      //fee and sell amounts calculations
      const takerFee =
        (Number(MatchedOrders[0].makerTotalSellAmount) *
          Number(MatchedOrders[0].takerFeeRatio)) /
        1000;

      const makerFee =
        (Number(MatchedOrders[0].takerTotalSellAmount) *
          Number(MatchedOrders[0].makerFeeRatio)) /
        1000;

      const makerSellAmount =
        Number(MatchedOrders[0].makerTotalSellAmount) - takerFee;
      const takerSellAmount =
        Number(MatchedOrders[0].takerTotalSellAmount) - makerFee;

      //pre transaction balances
      const app3T3preTxBalance = await token3.balanceOf(daoMember3.address);
      const app4T4preTxBalance = await token4.balanceOf(daoMember4.address);
      const app3T4preTxBalance = await token4.balanceOf(daoMember3.address);
      const app4T3preTxBalance = await token3.balanceOf(daoMember4.address);
      const adminT3preTxBalance = await token3.balanceOf(gnosis.address);
      const adminT4preTxBalance = await token4.balanceOf(gnosis.address);

      //add the caller into broker addresses mappings
      await proxy.connect(daoMember1).registerBrokers([deployer.address]);

      //broadcast the batchOrders to the contract
      await proxy.connect(deployer).Swap(MatchedOrders);

      // post transaction balances
      const app3T3postTxBalance = await token3.balanceOf(daoMember3.address);
      const app4T4postTxBalance = await token4.balanceOf(daoMember4.address);
      const app3T4postTxBalance = await token4.balanceOf(daoMember3.address);
      const app4T3postTxBalance = await token3.balanceOf(daoMember4.address);
      const adminT3postTxBalance = await token3.balanceOf(gnosis.address);
      const adminT4postTxBalance = await token4.balanceOf(gnosis.address);

      // asserts for balance checks

      expect(Number(app3T3postTxBalance)).to.be.equal(
        Number(app3T3preTxBalance) -
          Number(MatchedOrders[0].makerTotalSellAmount)
      );
      expect(Number(app4T4postTxBalance)).to.be.equal(
        Number(app4T4preTxBalance) -
          Number(MatchedOrders[0].takerTotalSellAmount)
      );

      expect(Number(app3T4postTxBalance)).to.be.equal(
        Number(app3T4preTxBalance) + takerSellAmount
      );
      expect(Number(app4T3postTxBalance)).to.be.equal(
        Number(app4T3preTxBalance) + makerSellAmount
      );
      expect(Number(adminT3postTxBalance)).to.be.equal(
        Number(adminT3preTxBalance) + takerFee
      );
      expect(Number(adminT4postTxBalance)).to.be.equal(
        Number(adminT4preTxBalance) + makerFee
      );

      // predicting the result of the swapExecuted event
      const eventsExpectedArguments = [
        [ethers.BigNumber.from(1), 200],
        [ethers.BigNumber.from(2), 402],
        [ethers.BigNumber.from(3), 417],
        [ethers.BigNumber.from(4), 417],
        [ethers.BigNumber.from(5), 417],
        [ethers.BigNumber.from(6), 408],
        [ethers.BigNumber.from(7), 417],
      ];

      // uint16 private constant ZERO_TRANSFER_AMOUNT_ERROR_CODE = 406;

      // event data
      const tx = await proxy.Swap(MatchedOrders);
      const transactionReceipt = await tx.wait();
      const events = transactionReceipt.events;

      //assert
      // compare the event data with the predicted values
      for (let i = 0; i < MatchedOrders.length; i++) {
        expect(events[8].args[0][i][0]).to.equals(
          eventsExpectedArguments[i][0]
        );
        expect(events[8].args[0][i][1]).to.equals(
          eventsExpectedArguments[i][1]
        );
      }
    });

    it("should emit TranactionCreated event", async function () {
      // arrange

      //executeSwap functions input(order)
      const MatchedOrders = [
        {
          makerFeeRatio: 10,
          takerFeeRatio: 20,
          makerOrderID: 1234,
          takerOrderID: 4321,
          makerValidUntil: 1000,
          takerValidUntil: 1000,
          matchID: 1,
          makerRatioSellArg: 3n * 10n ** 18n,
          makerRatioBuyArg: 600n * 10n ** 18n,
          takerRatioSellArg: 650n * 10n ** 18n,
          takerRatioBuyArg: 3n * 10n ** 18n,
          makerTotalSellAmount: 1n * 10n ** 18n,
          takerTotalSellAmount: 200n * 10n ** 18n,
          makerSellTokenAddress: token3.address,
          takerSellTokenAddress: token4.address,
          makerUserAddress: daoMember3.address,
          takerUserAddress: daoMember4.address,
          makerSignature: "",
          takerSignature: "",
        },
      ];

      // creating message arguments
      const makermessageHash = ethers.utils.solidityKeccak256(
        [
          "uint16",
          "uint64",
          "uint64",
          "uint256",
          "uint256",
          "address",
          "address",
        ],
        [
          maxFeeRatio,
          MatchedOrders[0].makerValidUntil,
          chainID,
          MatchedOrders[0].makerRatioSellArg,
          MatchedOrders[0].makerRatioBuyArg,
          MatchedOrders[0].makerSellTokenAddress,
          MatchedOrders[0].takerSellTokenAddress,
        ]
      );
      //creating the wrong msg hash by swapping the takerRatioSellArg with makerRatioSellArg
      const takermessageHash = ethers.utils.solidityKeccak256(
        [
          "uint16",
          "uint64",
          "uint64",
          "uint256",
          "uint256",
          "address",
          "address",
        ],
        [
          maxFeeRatio,
          MatchedOrders[0].takerValidUntil,
          chainID,
          MatchedOrders[0].makerRatioSellArg,
          MatchedOrders[0].takerRatioBuyArg,
          MatchedOrders[0].takerSellTokenAddress,
          MatchedOrders[0].makerSellTokenAddress,
        ]
      );

      const makerMessageHashBinary = ethers.utils.arrayify(makermessageHash);
      const takerMessageHashBinary = ethers.utils.arrayify(takermessageHash);

      const makerSignature = await daoMember3.signMessage(
        makerMessageHashBinary
      );
      const takerSignature = await daoMember4.signMessage(
        takerMessageHashBinary
      );

      //adding signatures
      MatchedOrders[0].makerSignature = makerSignature;
      MatchedOrders[0].takerSignature = takerSignature;

      //base transfers
      const _amounts = [
        ethers.BigNumber.from(1000n * 10n ** 18n),
        ethers.BigNumber.from(1000n * 10n ** 18n),
        ethers.BigNumber.from(1000n * 10n ** 18n),
        ethers.BigNumber.from(1000n * 10n ** 18n),
      ];
      const _tokens = [token1, token2, token3, token4];

      const _callers = [daoMember1, daoMember2, daoMember3, daoMember4];

      await transferSomeTokens(_tokens, _amounts, _callers);

      // base allowances
      await token1
        .connect(daoMember1)
        .increaseAllowance(proxy.address, 1000n * 10n ** 18n);
      await token2
        .connect(daoMember2)
        .increaseAllowance(proxy.address, 1000n * 10n ** 18n);
      await token3
        .connect(daoMember3)
        .increaseAllowance(proxy.address, 1000n * 10n ** 18n);
      await token4
        .connect(daoMember4)
        .increaseAllowance(proxy.address, 1000n * 10n ** 18n);

      // adding caller to the brokerAddressees mapping
      await proxy.connect(daoMember1).registerBrokers([deployer.address]);
      // broadcast the order to the contract
      const tx = await proxy.connect(deployer).Swap(MatchedOrders);

      // event data
      const transactionReceipt = await tx.wait();
      const events = transactionReceipt.events;
      const expectedMatchID = ethers.BigNumber.from(1);
      //predict the event data
      const expectedStatusCode = 401;

      //assert
      // compare the event data with the predicted values

      expect(events[0].args[0][0][0]).to.equals(expectedMatchID);
      expect(events[0].args[0][0][1]).to.equals(expectedStatusCode);
    });
    it("should revert if msg.sender is not a caller", async function () {
      //executeSwap functions input(order)
      const MatchedOrders = [
        {
          makerFeeRatio: 10,
          takerFeeRatio: 20,
          makerOrderID: 1234,
          takerOrderID: 4321,
          makerValidUntil: 100,
          takerValidUntil: 100,
          matchID: 1,
          makerRatioSellArg: 3n * 10n ** 18n,
          makerRatioBuyArg: 600n * 10n ** 18n,
          takerRatioSellArg: 650n * 10n ** 18n,
          takerRatioBuyArg: 3n * 10n ** 18n,
          makerTotalSellAmount: 1n * 10n ** 18n,
          takerTotalSellAmount: 200n * 10n ** 18n,
          makerSellTokenAddress: token3.address,
          takerSellTokenAddress: token4.address,
          makerUserAddress: daoMember3.address,
          takerUserAddress: daoMember4.address,
          makerSignature: "",
          takerSignature: "",
        },
      ];

      // creating message arguments
      const makermessageHash = ethers.utils.solidityKeccak256(
        [
          "uint16",
          "uint64",
          "uint64",
          "uint256",
          "uint256",
          "address",
          "address",
        ],
        [
          maxFeeRatio,
          MatchedOrders[0].makerValidUntil,
          chainID,
          MatchedOrders[0].makerRatioSellArg,
          MatchedOrders[0].makerRatioBuyArg,
          MatchedOrders[0].makerSellTokenAddress,
          MatchedOrders[0].takerSellTokenAddress,
        ]
      );
      const takermessageHash = ethers.utils.solidityKeccak256(
        [
          "uint16",
          "uint64",
          "uint64",
          "uint256",
          "uint256",
          "address",
          "address",
        ],
        [
          maxFeeRatio,
          MatchedOrders[0].takerValidUntil,
          chainID,
          MatchedOrders[0].makerRatioSellArg,
          MatchedOrders[0].takerRatioBuyArg,
          MatchedOrders[0].takerSellTokenAddress,
          MatchedOrders[0].makerSellTokenAddress,
        ]
      );

      const makerMessageHashBinary = ethers.utils.arrayify(makermessageHash);
      const takerMessageHashBinary = ethers.utils.arrayify(takermessageHash);

      const makerSignature = await daoMember3.signMessage(
        makerMessageHashBinary
      );
      const takerSignature = await daoMember4.signMessage(
        takerMessageHashBinary
      );

      //adding signatures
      MatchedOrders[0].makerSignature = makerSignature;
      MatchedOrders[0].takerSignature = takerSignature;

      //base transfers
      const _amounts = [
        ethers.BigNumber.from(1000n * 10n ** 18n),
        ethers.BigNumber.from(1000n * 10n ** 18n),
        ethers.BigNumber.from(1000n * 10n ** 18n),
        ethers.BigNumber.from(1000n * 10n ** 18n),
      ];
      const _tokens = [token1, token2, token3, token4];

      const _callers = [daoMember1, daoMember2, daoMember3, daoMember4];

      await transferSomeTokens(_tokens, _amounts, _callers);

      // base allowances
      await token1
        .connect(daoMember1)
        .increaseAllowance(proxy.address, 1000n * 10n ** 18n);
      await token2
        .connect(daoMember2)
        .increaseAllowance(proxy.address, 1000n * 10n ** 18n);
      await token3
        .connect(daoMember3)
        .increaseAllowance(proxy.address, 1000n * 10n ** 18n);
      await token4
        .connect(daoMember4)
        .increaseAllowance(proxy.address, 1000n * 10n ** 18n);
      //asserts
      await expect(
        proxy.connect(daoMember6).Swap(MatchedOrders)
      ).to.be.revertedWith("ERROR: unauthorized caller");
    });
  });
});
