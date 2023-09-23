import { expect } from "chai";
import {
  deployContracts,
  getAccounts,
  deployGnosisContract,
} from "../../Utils.test";
import { Contract, ethers } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import hre from "hardhat";

describe("swapper", function () {
  let gnosis: Contract,
    daoMember1: SignerWithAddress,
    daoMember4: SignerWithAddress,
    evil: SignerWithAddress,
    proxy: ethers.Contract,
    provider: ethers.providers.JsonRpcProvider;

  beforeEach(async function () {
    gnosis = (await deployGnosisContract()).gnosis;
    proxy = (await deployContracts(gnosis.address)).proxy;

    daoMember1 = (await getAccounts()).daoMember1;

    daoMember4 = (await getAccounts()).daoMember4;
    evil = (await getAccounts()).evil;

    provider = hre.ethers.provider;
    await provider.ready;
  });
  describe("`unregisterBrokers` Functionality", async function () {
    it("should remove a broker from the mapping", async function () {
      //check if the address is not a broker
      expect(await proxy.brokersAddresses(daoMember4.address)).to.equal(true);
      await proxy.connect(daoMember1).unregisterBrokers([daoMember4.address]);
      //assert
      expect(await proxy.brokersAddresses(daoMember4.address)).to.equal(false);
    });
    it("should revert if msg.sender is not an daoMember in Admin contract", async function () {
      //assert
      await expect(
        proxy.connect(evil).unregisterBrokers([daoMember4.address])
      ).to.be.revertedWith("ERROR: unauthorized caller");
    });
  });
});
