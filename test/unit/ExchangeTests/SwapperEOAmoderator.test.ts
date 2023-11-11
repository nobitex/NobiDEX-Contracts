import { expect } from "chai";
import {
  deployContracts,
  getAccounts,
  deployGnosisContract,
} from "../../Utils.test";
import { Contract } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

describe("swapper", function () {
  let gnosis: Contract,
    EOAswapper: Contract,
    EOAmoderator: SignerWithAddress,
    daoMember1: SignerWithAddress,
    daoMember4: SignerWithAddress,
    daoMember5: SignerWithAddress;

  beforeEach(async function () {
    gnosis = (await deployGnosisContract()).gnosis;
    EOAswapper = (await deployContracts(gnosis.address)).EOAswapper;
    EOAmoderator = (await getAccounts()).EOAmoderator;
    daoMember1 = (await getAccounts()).daoMember1;
    daoMember4 = (await getAccounts()).daoMember4;
    daoMember5 = (await getAccounts()).daoMember5;
  });
  describe("`moderator` authories", async function () {
    it("EOAmoderator should be able to pause the swapper", async function () {
      // act & assert

      await EOAswapper.connect(EOAmoderator).pause([]);

      expect(await EOAswapper.paused()).to.equal(true);
    });
    it("EOAmoderator should be able to add a new broker to the 'brokersAdresses' mapping", async function () {
      //check if the address is not a broker
      expect(await EOAswapper.brokersAddresses(daoMember5.address)).to.equal(
        false
      );
      await EOAswapper.connect(EOAmoderator).registerBrokers([
        daoMember5.address,
      ]);
      //assert
      expect(await EOAswapper.brokersAddresses(daoMember5.address)).to.equal(
        true
      );
    });
    it("EOAmoderator should remove a broker from 'brokersAdresses' mapping", async function () {
      //check if the address is not a broker
      expect(await EOAswapper.brokersAddresses(daoMember4.address)).to.equal(
        true
      );
      await EOAswapper.connect(EOAmoderator).unregisterBrokers([
        daoMember4.address,
      ]);
      //assert
      expect(await EOAswapper.brokersAddresses(daoMember4.address)).to.equal(
        false
      );
    });
    it("EOAmoderator should be able to update the fee ratio", async function () {
      //check if the address is not a broker
      expect(await EOAswapper.maxFeeRatio()).to.equal(20);
      await EOAswapper.connect(EOAmoderator).updateFeeRatio(50);
      //assert
      expect(await EOAswapper.maxFeeRatio()).to.equal(50);
    });
    it("EOAmoderator should be able to propose and update a new valid moderator", async function () {
      // act & assert
      await EOAswapper.connect(EOAmoderator).proposeToUpdateModerator(
        gnosis.address
      );
      //assert
      expect(await EOAswapper.candidateModerator()).to.equal(gnosis.address);

      await gnosis
        .connect(daoMember1)
        .updateSwapperModerator(EOAswapper.address);
      expect(await EOAswapper.Moderator()).to.equal(gnosis.address);

      expect(await EOAswapper.paused()).to.equal(false);

      // check to see if the gnosis has access to both isDaoMember and isModerator modifier
      await gnosis.connect(daoMember1).pauseSwapper(EOAswapper.address, []);
      expect(await EOAswapper.paused()).to.equal(true);
      await gnosis.connect(daoMember1).unpauseSwapper(EOAswapper.address);
      expect(await EOAswapper.paused()).to.equal(false);
    });
    it("EOAmoderator should have access to both isDaoMember and isModerator mod", async function () {
      await EOAswapper.connect(EOAmoderator).pause([]);
      expect(await EOAswapper.paused()).to.equal(true);
      await EOAswapper.connect(EOAmoderator).unpause();
      expect(await EOAswapper.paused()).to.equal(false);
    });
  });
});
