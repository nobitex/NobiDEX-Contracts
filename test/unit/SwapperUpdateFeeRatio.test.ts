import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { deployContracts, getAccounts } from "../Utils.test";
const defaultFee = 20;
describe("Swapper - updateSwapperFee", function () {
  it("should set swapper fee to non-zero value 5", async function () {
    // arrange
    const { swapper, gnosis } = await loadFixture(deployContracts);
    // fetch current fee
    const currentFee = await swapper.maxFeeRatio();
    // double check values
    expect(currentFee).to.equal(defaultFee);

    // create a  transaction
    await gnosis.updateSwapperFee(swapper.address, 5);

    // fetch new fee
    const newFee = await swapper.maxFeeRatio();
    expect(newFee).to.equal(5);
  });
  it("should revert if external call fails", async function () {
    // arrange
    const { gnosis, swapper } = await loadFixture(deployContracts);
    // fetch current fee
    const currentFee = await swapper.maxFeeRatio();
    expect(currentFee).to.equal(defaultFee);
    // assert
    await expect(
      gnosis.updateSwapperFee(swapper.address, 20)
    ).to.be.revertedWith("ERROR: external call failed");
  });
  it("should revert if caller is not admin", async function () {
    // arrange
    const { swapper } = await loadFixture(deployContracts);
    // fetch current fee
    const currentFee = await swapper.maxFeeRatio();
    // double check values
    expect(currentFee).to.equal(defaultFee);
    // assert

    await expect(swapper.updateFeeRatio(5)).to.be.revertedWith(
      "ERROR: unauthorized caller"
    );
  });
});
