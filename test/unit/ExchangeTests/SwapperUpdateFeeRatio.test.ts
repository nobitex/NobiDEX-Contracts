import { expect } from "chai";
import {
  deployContracts,
  deployGnosisContract,
} from "../../Utils.test";
import { Contract, ethers } from "ethers";
const defaultFee = 20;
describe("Swapper - updateSwapperFee", function () {
  let gnosis: Contract, swapper: ethers.Contract;

  beforeEach(async function () {
    gnosis = (await deployGnosisContract()).gnosis;
    swapper = (await deployContracts(gnosis.address)).swapper;
  });
  it("should set swapper fee to non-zero value 5", async function () {
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
    // fetch current fee
    const currentFee = await swapper.maxFeeRatio();
    expect(currentFee).to.equal(defaultFee);
    // assert
    await expect(gnosis.updateSwapperFee(swapper.address, 20)).to.be.revertedWith(
      "ERROR: external call failed"
    );
  });
  it("should revert if caller is not admin", async function () {
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
