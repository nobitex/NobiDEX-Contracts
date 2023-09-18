import { expect } from "chai";
import hre from "hardhat";
import {
  deployContracts,
  getAccounts,
  createMsgHash,
  transferSomeTokens,
  deployGnosisContract,
} from "../../Utils.test";
import { Contract, ethers } from "ethers";

describe("swapper", function () {
  let gnosis: Contract,
    token3: Contract,
    token4: Contract,
    proxy: ethers.Contract,
    provider: ethers.providers.JsonRpcProvider;

  beforeEach(async function () {
    gnosis = (await deployGnosisContract()).gnosis;
    proxy = (await deployContracts(gnosis.address)).proxy;
    token3 = (await deployContracts(gnosis.address)).token3;
    token4 = (await deployContracts(gnosis.address)).token4;
    provider = hre.ethers.provider;
    await provider.ready;
  });
  describe("`revokeOrder` Functionality", async function () {
    it("should cancel an order with the given ID", async function () {
      // arrange
      const { deployer, daoMember1, daoMember3, daoMember4 } =
        await getAccounts();

      const provider = hre.ethers.provider;
      await provider.ready;
      const network = await provider.getNetwork();
      const chainID = network.chainId;

      let MatchedOrders;

      MatchedOrders = [
        {
          //successful order
          makerFeeRatio: 10,
          takerFeeRatio: 20,
          makerOrderID: 2356,
          takerOrderID: 3154,
          chainID: 5,
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
        },
      ];

      MatchedOrders = await createMsgHash(MatchedOrders);
     

      // base transfers
      const _amounts = [
        ethers.BigNumber.from(1000n * 10n ** 18n),
        ethers.BigNumber.from(1000n * 10n ** 18n),
        ethers.BigNumber.from(1000n * 10n ** 18n),
        ethers.BigNumber.from(1000n * 10n ** 18n),
      ];
      const _tokens = [token3, token4];

      const _callers = [daoMember3, daoMember4];

      await transferSomeTokens(_tokens, _amounts, _callers);

      // base allowances

      await token3
        .connect(daoMember3)
        .increaseAllowance(proxy.address, 1000n * 10n ** 18n);
      await token4
        .connect(daoMember4)
        .increaseAllowance(proxy.address, 1000n * 10n ** 18n);

      // adding caller to the brokerAddressees mapping
      await proxy.connect(daoMember1).registerBrokers([deployer.address]);
      // cancelling the makers order
      const cancelOrders = {
        maxFeeRatio: 20,
        orderID: 2356,
        validUntil: 100,
        chainID: chainID,
        ratioSellArg: 3n * 10n ** 18n,
        ratioBuyArg: 600n * 10n ** 18n,
        sellTokenAddress: token3.address,
        buyTokenAddress: token4.address,
      };

      const makerSignature = MatchedOrders[0].makerSignature;
      const makerOrderID = 2356;

      const tx1 = await proxy
        .connect(daoMember3)
        .revokeOrder(cancelOrders, makerSignature);

      // getting the events data

      const transactionReceipt1 = await tx1.wait();

      const events1 = transactionReceipt1.events;

      //predict the event data
      // const makerOrderID = 2356

      //assert
      // compare the event data with the predicted values
      expect(events1[0].args[0]).to.equals(daoMember3.address);
      expect(events1[0].args[1]).to.equals(makerOrderID);

      // broadcast the order to the contract

      const tx2 = await proxy.connect(deployer).Swap(MatchedOrders);

      // getting the events data
      const transactionReceipt2 = await tx2.wait();
      const events2 = transactionReceipt2.events;
      const expectedMatchID = ethers.BigNumber.from(1);
      //predict the event data
      const expectedStatusCode = 410;

      //assert
      // compare the event data with the predicted values
      expect(events2[0].args[0][0][0]).to.equals(expectedMatchID);
      expect(events2[0].args[0][0][1]).to.equals(expectedStatusCode);
    });
  });
});
