import { expect } from "chai";
import { Contract, ethers } from "ethers";
import hre from "hardhat";
import {
  deployContracts,
  deployGnosisContract,
  deployUserInfo,
  getAccounts,
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
    userInfoContract = (await deployUserInfo()).userInfo;
    provider = hre.ethers.provider;
    await provider.ready;
  });
  describe("getter functions Functionality", async function () {
    it("should get the user info", async function () {
      const userInfo = await userInfoContract.getUserInfo(
        daoMember1.address,
        [token1.address, token2.address],
        proxy.address,
        1
      );
      console.log("this is user info", userInfo);
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
  });
});
