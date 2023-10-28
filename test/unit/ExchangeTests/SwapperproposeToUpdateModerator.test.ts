import { expect } from "chai";
import {
  deployContracts,
  getAccounts,
  deployGnosisContract,
} from "../../Utils.test";
import { Contract } from "@ethersproject/contracts";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

describe("swapper - Set swapper Admin candidate", function () {
  let gnosis: Contract, swapper: Contract, daoMember1: SignerWithAddress;

  beforeEach(async function () {
    gnosis = (await deployGnosisContract()).gnosis;
    swapper = (await deployContracts(gnosis.address)).swapper;
    daoMember1 = (await getAccounts()).daoMember1;
  });

  it("should set swapper admin to new address", async function () {
    // fetch current values
    const currentAdmin = await swapper.Moderator();
    // double check values
    expect(currentAdmin).to.equal(gnosis.address);
    await gnosis.proposeToUpdateSwapperModerator(
      swapper.address,
      daoMember1.address
    );

    // fetch & assert
    const candidateModerator = await swapper.candidateModerator();
    expect(candidateModerator).to.be.equal(daoMember1.address);
  });
  it("should revert if external call fails", async function () {
    await gnosis.proposeToUpdateSwapperModerator(swapper.address, gnosis.address);
    // act & assert
    await expect(
      gnosis.proposeToUpdateSwapperModerator(swapper.address, gnosis.address)
    ).to.be.revertedWith("ERROR: external call failed");
  });
  it("should revert if caller is not admin", async function () {
    // fetch current values
    const currentAdmin = await swapper.Moderator();
    // double check values
    expect(currentAdmin).to.equal(gnosis.address);
    await gnosis.proposeToUpdateSwapperModerator(
      swapper.address,
      daoMember1.address
    );

    // fetch & assert
    await expect(
      swapper.proposeToUpdateModerator(daoMember1.address)
    ).to.be.revertedWith("ERROR: unauthorized caller");
  });
});
