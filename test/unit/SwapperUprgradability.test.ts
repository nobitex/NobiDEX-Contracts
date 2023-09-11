import { expect } from "chai";
import { ethers } from "hardhat";
import { deployContracts, deployGnosisContract } from "../Utils.test";
import { Contract } from "ethers";

describe("Proxy - Upgradability", function () {
  let gnosis: Contract, proxy: Contract;

  beforeEach(async function () {
    gnosis = (await deployGnosisContract()).gnosis;
    proxy = (await deployContracts(gnosis.address)).proxy;
  });

  describe("`swapper upgradability` Functionality", async function () {
    it("should upgrade successfully", async function () {
      const proxyAddress = proxy.address;

      const SwapperUpgrade = await ethers.getContractFactory("SwapperUpgrade");
      // const upgraded = await upgrades.upgradeProxy(await proxy.address, SwapperUpgrade);
      const swapperUpgrade = await SwapperUpgrade.deploy();
      await swapperUpgrade.deployed();

      await gnosis.upgradeSwapper(proxy.address, swapperUpgrade.address);

      const swapperUpgraded = await ethers.getContractFactory("SwapperUpgrade");
      proxy = await swapperUpgraded.attach(proxy.address);

      // assert

      const newAddress = await proxy.testUpgradeability();
      expect(newAddress).to.be.equal(proxyAddress);
    });
    it("should revert if caller is not a dao member", async function () {
      const SwapperUpgrade = await ethers.getContractFactory("SwapperUpgrade");
      // const upgraded = await upgrades.upgradeProxy(await proxy.address, SwapperUpgrade);
      const swapperUpgrade = await SwapperUpgrade.deploy();
      await swapperUpgrade.deployed();

      await expect(proxy.upgradeTo(swapperUpgrade.address)).to.be.revertedWith(
        "ERROR: unauthorized caller"
      );
    });
    it("should revert if implementation address is zero", async function () {
      const zeroAdd = ethers.constants.AddressZero;
      const SwapperUpgrade = await ethers.getContractFactory("SwapperUpgrade");
      // const upgraded = await upgrades.upgradeProxy(await proxy.address, SwapperUpgrade);
      const swapperUpgrade = await SwapperUpgrade.deploy();
      await swapperUpgrade.deployed();

      await expect(
        gnosis.upgradeSwapper(proxy.address, zeroAdd)
      ).to.be.revertedWith("ERROR: external call failed.");
    });
    it("should check the Data Migration", async function () {
      const proxyAddress = proxy.address;

      const SwapperUpgrade = await ethers.getContractFactory("SwapperUpgrade");
      // const upgraded = await upgrades.upgradeProxy(await proxy.address, SwapperUpgrade);
      const swapperUpgrade = await SwapperUpgrade.deploy();
      await swapperUpgrade.deployed();

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
