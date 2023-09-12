import { expect } from "chai";
import hre from "hardhat";
import { Contract, ethers } from "ethers";
import { deployContracts, deployGnosisContract } from "../Utils.test";

describe("swaper", function () {
  let gnosis: Contract, proxy: Contract, provider: ethers.providers.JsonRpcProvider;

  beforeEach(async function () {
    gnosis = (await deployGnosisContract()).gnosis;
    proxy = (await deployContracts(gnosis.address)).proxy;
    provider = hre.ethers.provider;
    await provider.ready;
  });
  describe("getter functions Functionality", async function () {
    it("should get the chainID", async function () {
      // arrange
      const network = await provider.getNetwork();
      const chainID = network.chainId;
      expect(await proxy.getChainID()).to.equal(chainID);
    });
    it("should get the block number", async function () {
      const block = await provider.getBlock("latest");
      const blockNumber = block.number;
      expect(await proxy.getBlockNumber()).to.equal(blockNumber);
    });
    it("should get the contract version", async function () {
      expect(await proxy.version()).to.equal(3);
    });
    it("should get the FeeRatioDenominator", async function () {
      expect(await proxy.FeeRatioDenominator()).to.equal(1000);
    });
  });
});
