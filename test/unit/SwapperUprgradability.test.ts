import { expect } from "chai";
import { ethers } from "hardhat";
import {
  deployContracts,
  deployGnosisContract,
  deployProxyUpgrade,
} from "../Utils.test";
import { Contract } from "ethers";

describe("Proxy - Upgradability", function () {
  let gnosis: Contract, proxy: Contract, swapperUpgrade: Contract;

  beforeEach(async function () {
    gnosis = (await deployGnosisContract()).gnosis;
    proxy = (await deployContracts(gnosis.address)).proxy;
    swapperUpgrade = (await deployProxyUpgrade()).swapperUpgrade;
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
  });
});
