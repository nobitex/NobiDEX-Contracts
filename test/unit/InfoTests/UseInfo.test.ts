import { expect } from "chai";
import { BigNumber, Contract, ethers } from "ethers";
import hre from "hardhat";
import {
  deployContracts,
  deployGnosisContract,
  getAccounts,
  transferSomeTokensTo,
  createMsgHash,
} from "../../Utils.test";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

describe("user info", function () {
  let gnosis: Contract,
    swapper: Contract,
    userInfoContract: Contract,
    provider: ethers.providers.JsonRpcProvider,
    token1: Contract,
    token2: Contract,
    daoMember1: SignerWithAddress;

  beforeEach(async function () {
    gnosis = (await deployGnosisContract()).gnosis;
    swapper = (await deployContracts(gnosis.address)).swapper;
    token1 = (await deployContracts(gnosis.address)).token1;
    token2 = (await deployContracts(gnosis.address)).token2;
    daoMember1 = (await getAccounts()).daoMember1;
    userInfoContract = (await deployContracts(gnosis.address)).userInfo;
    provider = hre.ethers.provider;
    await provider.ready;
  });

  it("Should get the user info", async function () {
    const userInfo = await userInfoContract[
      "getUserInfo(address,address[],address,uint64)"
    ](daoMember1.address, [token1.address, token2.address], swapper.address, 1);

    expect(userInfo.tokenBalances[0].tokenAddress).to.equal(token1.address);
    expect(userInfo.tokenBalances[0].tokenBalance).to.equal(0);
    expect(userInfo.tokenAllowances[0].tokenAddress).to.equal(token1.address);
    expect(userInfo.tokenAllowances[0].tokenAllowance).to.equal(0);
    expect(userInfo.blockNumber.toNumber()).to.equal(
      await userInfoContract.provider.getBlockNumber()
    );
    expect(userInfo.codeSize).to.equal(0);
    expect(userInfo.isRevoked).to.be.false;
  });

  it("Should transfer some funds and get the user info", async function () {
    await transferSomeTokensTo(
      [token1],
      [BigNumber.from(1000n * 10n ** 18n)],
      daoMember1.address
    );

    await token1
      .connect(daoMember1)
      .increaseAllowance(swapper.address, 1000n * 10n ** 18n);

    const userInfo = await userInfoContract[
      "getUserInfo(address,address[],address,uint64)"
    ](daoMember1.address, [token1.address, token2.address], swapper.address, 1);

    expect(userInfo.tokenBalances[0].tokenAddress).to.equal(token1.address);
    expect(Number(userInfo.tokenBalances[0].tokenBalance)).to.equal(
      1000 * 10 ** 18
    );
    expect(userInfo.tokenAllowances[0].tokenAddress).to.equal(token1.address);
    expect(Number(userInfo.tokenAllowances[0].tokenAllowance)).to.equal(
      1000 * 10 ** 18
    );
    expect(userInfo.blockNumber.toNumber()).to.equal(
      await userInfoContract.provider.getBlockNumber()
    );
    expect(userInfo.codeSize).to.equal(0);
    expect(userInfo.isRevoked).to.be.false;
  });

  it("Should revoke an order and get the user info", async function () {
    const messageParameters = {
      maxFeeRatio: 20,
      orderID: 1,
      validUntil: (await swapper.provider.getBlockNumber()) + 1,
      chainID: (await swapper.provider.getNetwork()).chainId,
      ratioSellArg: 3n * 10n ** 18n,
      ratioBuyArg: 3n * 10n ** 18n,
      sellTokenAddress: token1.address,
      buyTokenAddress: token2.address,
      UserSignature: "",
    };

    await createMsgHash(messageParameters, swapper);

    const messageParametersSignature = messageParameters.UserSignature;

    await swapper
      .connect(daoMember1)
      .revokeOrder(messageParameters, messageParametersSignature);

    const userInfo = await userInfoContract[
      "getUserInfo(address,address[],address,uint64)"
    ](daoMember1.address, [token1.address, token2.address], swapper.address, 1);

    expect(userInfo.tokenBalances[0].tokenAddress).to.equal(token1.address);
    expect(userInfo.tokenBalances[0].tokenBalance).to.equal(0);
    expect(userInfo.tokenAllowances[0].tokenAddress).to.equal(token1.address);
    expect(userInfo.tokenAllowances[0].tokenAllowance).to.equal(0);
    expect(userInfo.blockNumber.toNumber()).to.equal(
      await userInfoContract.provider.getBlockNumber()
    );
    expect(userInfo.codeSize).to.equal(0);
    expect(userInfo.isRevoked).to.be.true;
  });
});
