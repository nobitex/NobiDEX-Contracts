import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import hre from "hardhat";
import { ethers } from "ethers";
import { deployContracts, getAccounts } from "../Utils.test";

describe("swapper", function () {
  describe("getter functions Functionality", async function () {
    it("should get the chainID", async function () {
      // arrange

      const { swapper } = await loadFixture(deployContracts);
      const provider = hre.ethers.provider;
      await provider.ready;
      const network = await provider.getNetwork();
      const chainID = network.chainId;
      expect(await swapper.getChainID()).to.equal(chainID);
    });
    it("should get the block number", async function () {
      const { swapper } = await loadFixture(deployContracts);
      const provider = hre.ethers.provider;
      await provider.ready;
      const block = await provider.getBlock('latest');
      const blockNumber = block.number;
      expect(await swapper.getblockNumber()).to.equal(blockNumber);
    });
    it("should get the contract version", async function () {
      const { swapper } = await loadFixture(deployContracts);

      expect(await swapper.version()).to.equal(3);
    });
    it("should get the FeeRatioDenominator", async function () {
        const { swapper } = await loadFixture(deployContracts);
  
        expect(await swapper.FeeRatioDenominator()).to.equal(1000);
      })
  });
});
