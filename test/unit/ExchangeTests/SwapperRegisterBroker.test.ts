import { expect } from "chai";
import {
  deployContracts,
  getAccounts,
  deployGnosisContract,
} from "../../Utils.test";
import { Contract } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

describe("swapper", function () {
  describe("`registerBrokers` Functionality", async function () {
    let gnosis: Contract,
      swapper: Contract,
      daoMember1: SignerWithAddress,
      daoMember5: SignerWithAddress,
      evil: SignerWithAddress;

    beforeEach(async function () {
      gnosis = (await deployGnosisContract()).gnosis;
      swapper = (await deployContracts(gnosis.address)).swapper;
      daoMember1 = (await getAccounts()).daoMember1;
      daoMember5 = (await getAccounts()).daoMember5;
      evil = (await getAccounts()).evil;
    });
    it("should add a new broker to the 'brokersAdresses' mapping", async function () {
      //check if the address is not a broker
      expect(await swapper.brokersAddresses(daoMember5.address)).to.equal(false);
      await swapper.connect(daoMember1).registerBrokers([daoMember5.address]);
      //assert
      expect(await swapper.brokersAddresses(daoMember5.address)).to.equal(true);
    });
    it("should revert if msg.sender is not an daoMember in gnosis contract", async function () {
      //assert
      await expect(
        swapper.connect(evil).registerBrokers([daoMember5.address])
      ).to.be.revertedWith("ERROR: unauthorized caller");
    });
  });
});
