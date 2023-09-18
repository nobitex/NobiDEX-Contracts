import { expect } from "chai";
import { ethers } from "hardhat";
import {
  deployContracts,
  getAccounts,
  transferSomeTokens,
  createMsgHash,
  deployGnosisContract,
  deployProxyUpgrade,
} from "../../Utils.test";
import { Contract } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

describe("Proxy - Upgradability", function () {
  let gnosis: Contract,
  proxy: Contract,
  swapperUpgrade: Contract,
  token1: Contract,
  token2: Contract,
  token3: Contract,
  token4: Contract,
  deployer: SignerWithAddress,
  daoMember1: SignerWithAddress,
  daoMember2: SignerWithAddress,
  daoMember3: SignerWithAddress,
  daoMember4: SignerWithAddress,
  daoMember5: SignerWithAddress;

  beforeEach(async function () {
    gnosis = (await deployGnosisContract()).gnosis;
    proxy = (await deployContracts(gnosis.address)).proxy;
    swapperUpgrade = (await deployProxyUpgrade()).swapperUpgrade;
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
    
  });

  describe("`swapper upgradability` Functionality", async function () {
    it("should upgrade successfully", async function () {
      const proxyAddress = proxy.address;

      await gnosis.upgradeSwapper(proxy.address, swapperUpgrade.address);

      const swapperUpgraded = await ethers.getContractFactory("SwapperUpgrade");
      proxy = await swapperUpgraded.attach(proxy.address);

      // assert

      const newAddress = await proxy.testUpgradeability();
      expect(newAddress).to.be.equal(proxyAddress);
    });
    it("should revert if caller is not a dao member", async function () {
      await expect(proxy.upgradeTo(swapperUpgrade.address)).to.be.revertedWith(
        "ERROR: unauthorized caller"
      );
    });
    it("should revert if implementation address is zero", async function () {
      const zeroAdd = ethers.constants.AddressZero;

      await expect(
        gnosis.upgradeSwapper(proxy.address, zeroAdd)
      ).to.be.revertedWith("ERROR: external call failed.");
    });
    it("should check the Data Migration", async function () {
      const proxyAddress = proxy.address;

      await gnosis.upgradeSwapper(proxy.address, swapperUpgrade.address);

      const swapperUpgraded = await ethers.getContractFactory("SwapperUpgrade");
      proxy = await swapperUpgraded.attach(proxy.address);

      // assert

      const newAddress = await proxy.testUpgradeability();
      expect(newAddress).to.be.equal(proxyAddress);
      expect(await proxy.maxFeeRatio()).to.be.equal(20);
    });
    it("should emit TranactionCreated events", async function () {

     // upgrade the contract
      await gnosis.upgradeSwapper(proxy.address, swapperUpgrade.address);

      const swapperUpgraded = await ethers.getContractFactory("SwapperUpgrade");
      proxy = await swapperUpgraded.attach(proxy.address);

      // check some orders

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
  });
});
