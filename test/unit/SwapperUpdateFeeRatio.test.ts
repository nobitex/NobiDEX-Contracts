import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { deployContracts, getAccounts } from "../Utils.test";
const defaultFee = 20;
describe("Swapper - updateSwapperFee", function () {
  it("should set swapper fee to non-zero value 5", async function () {
    // arrange
    const { proxy, gnosis } = await loadFixture(deployContracts);
    // fetch current fee
    const currentFee = await proxy.maxFeeRatio();
    // double check values
    expect(currentFee).to.equal(defaultFee);

    // create a  transaction
    await gnosis.updateSwapperFee(proxy.address, 5);

    // fetch new fee
    const newFee = await proxy.maxFeeRatio();
    expect(newFee).to.equal(5);
  });
  it("should revert if external call fails", async function () {
    // arrange
    const { gnosis, proxy } = await loadFixture(deployContracts);
    // fetch current fee
    const currentFee = await proxy.maxFeeRatio();
    expect(currentFee).to.equal(defaultFee);
    // assert
    await expect(
      gnosis.updateSwapperFee(proxy.address, 20)
    ).to.be.revertedWith("ERROR: external call failed");
  });
  it("should revert if caller is not admin", async function () {
    // arrange
    const { proxy } = await loadFixture(deployContracts);
    // fetch current fee
    const currentFee = await proxy.maxFeeRatio();
    // double check values
    expect(currentFee).to.equal(defaultFee);
    // assert

    await expect(proxy.updateFeeRatio(5)).to.be.revertedWith(
      "ERROR: unauthorized caller"
    );
  });
});
