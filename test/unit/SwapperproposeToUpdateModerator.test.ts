import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { deployContracts, getAccounts } from "../Utils.test";

describe("swapper - Set swapper Admin candidate", function () {
  it("should set swapper admin to new address", async function () {
    // arrange
    const { gnosis, swapper } = await loadFixture(deployContracts);
    const { daoMember1 } = await getAccounts();
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
    // arrange
    const { gnosis, swapper } = await loadFixture(deployContracts);
    await gnosis.proposeToUpdateSwapperModerator(
      swapper.address,
      gnosis.address
    );
    // act & assert

    await expect(
       gnosis.proposeToUpdateSwapperModerator(
        swapper.address,
        gnosis.address
      )
    ).to.be.revertedWith("ERROR: external call failed");
  });
  it("should revert if caller is not admin", async function () {
    // arrange
    const { gnosis, swapper } = await loadFixture(deployContracts);
    const { daoMember1 } = await getAccounts();
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
    await expect(
      swapper.proposeToUpdateModerator(daoMember1.address)
    ).to.be.revertedWith("ERROR: unauthorized caller");
  });
});