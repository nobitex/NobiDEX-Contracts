import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import hre from "hardhat";
import { ethers } from "ethers";
import { deployContracts, getAccounts } from "../Utils.test";

describe("swaper", function () {
  describe("getter functions Functionality", async function () {
    it("should get the chainID", async function () {
      // arrange

      const { proxy } = await loadFixture(deployContracts);
      const provider = hre.ethers.provider;
      await provider.ready;
      const network = await provider.getNetwork();
      const chainID = network.chainId;
      expect(await proxy.getChainID()).to.equal(chainID);
    });
    it("should get the block number", async function () {
      const { proxy } = await loadFixture(deployContracts);
      const provider = hre.ethers.provider;
      await provider.ready;
      const block = await provider.getBlock('latest');
      const blockNumber = block.number;
      expect(await proxy.getBlockNumber()).to.equal(blockNumber);
    });
    it("should get the contract version", async function () {
      const { proxy } = await loadFixture(deployContracts);

      expect(await proxy.version()).to.equal(3);
    });
    it("should get the FeeRatioDenominator", async function () {
        const { proxy } = await loadFixture(deployContracts);
  
        expect(await proxy.FeeRatioDenominator()).to.equal(1000);
      })
  });
});
