import { expect } from "chai";
import { BigNumber, Contract, ethers } from "ethers";
import hre from "hardhat";
import {
  deployContracts,
  deployGnosisContract,
  getAccounts,
  transferSomeTokensTo,
} from "../../Utils.test";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

describe("user info", function () {
  let gnosis: Contract,
    proxy: Contract,
    userInfoContract: Contract,
    provider: ethers.providers.JsonRpcProvider,
    token1: Contract,
    token2: Contract,
    daoMember1: SignerWithAddress;

  beforeEach(async function () {
    gnosis = (await deployGnosisContract()).gnosis;
    proxy = (await deployContracts(gnosis.address)).proxy;
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
    ](daoMember1.address, [token1.address, token2.address], proxy.address, 1);

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
      .increaseAllowance(proxy.address, 1000n * 10n ** 18n);

    const userInfo = await userInfoContract[
      "getUserInfo(address,address[],address,uint64)"
    ](daoMember1.address, [token1.address, token2.address], proxy.address, 1);

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
    const messageParameters = [
      {
        maxFeeRatio: 20,
        orderID: 1,
        validUntil: (await proxy.provider.getBlockNumber()) + 1,
        chainID: (await proxy.provider.getNetwork()).chainId,
        ratioSellArg: 3n * 10n ** 18n,
        ratioBuyArg: 3n * 10n ** 18n,
        sellTokenAddress: token1.address,
        buyTokenAddress: token2.address,
      },
    ];

    const messageParametersHash = ethers.utils.solidityKeccak256(
      [
        "uint16",
        "uint64",
        "uint64",
        "uint256",
        "uint256",
        "uint256",
        "address",
        "address",
      ],
      [
        messageParameters[0].maxFeeRatio,
        messageParameters[0].orderID,
        messageParameters[0].validUntil,
        messageParameters[0].chainID,
        messageParameters[0].ratioSellArg,
        messageParameters[0].ratioBuyArg,
        messageParameters[0].sellTokenAddress,
        messageParameters[0].buyTokenAddress,
      ]
    );

    const messageParametersSignature = await daoMember1.signMessage(
      ethers.utils.arrayify(messageParametersHash)
    );

    await proxy
      .connect(daoMember1)
      .revokeOrder(messageParameters[0], messageParametersSignature);

    const userInfo = await userInfoContract[
      "getUserInfo(address,address[],address,uint64)"
    ](daoMember1.address, [token1.address, token2.address], proxy.address, 1);

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
