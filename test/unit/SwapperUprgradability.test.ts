import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { deployContracts, getAccounts } from "../Utils.test";
import { gnosis } from "@wagmi/chains";

describe("Proxy - Upgradability", function () {

  describe("`swapper upgradability` Functionality", async function () {
    it("should upgrade successfully", async function () {
      // arrange
console.log("1")
      let{proxy} = await deployContracts();
      console.log("2")
      const {SwapperUpgrade,gnosis} = await deployContracts();
      console.log("3")
      const proxyAddress = proxy.address;
      console.log("4")
      // act & assert
      // create transaction

      await gnosis.upgradeSwapper(proxy.address, SwapperUpgrade.address)
    //   const SwapperUpgradable = await ethers.getContractFactory("SwapperUpgrade");
      
      console.log("5")
      // assert 

      proxy = await SwapperUpgrade.attach(proxy.address);
      const newAddress = await proxy.testUpgradeability();
      expect(newAddress).to.be.equal(proxyAddress);
    });
    // it("should revert if caller is not a dao member", async function () {
    //   // arrange
    //   let { proxy } = await loadFixture(
    //     deployContracts
    //   );
    //   const multiSigV2 = await deployDAOMultiSigV2();
    //   const {daoMember1,daoMember2,daoMember3,evil } = await getAccounts();
    //   // act & assert
    //   // create transaction
    //   await proxy.connect(daoMember1).createUpgradeDaoMultiSigTransaction(multiSigV2.address);
    //   const [txs,index] = await proxy.getPendingTransactions(0, daoMember1.address)
    //   const txId = txs[index-1].id;
    //   // approve newly created transaction and assert to fail
    //   await proxy.connect(daoMember2).approveTransaction(txId);
    //   await proxy.connect(daoMember3).approveTransaction(txId);
    //   await expect(proxy.connect(evil).upgradeTo(multiSigV2.address)).to.be.revertedWith("ERROR: invalid caller");
    // });
    // it("should revert if multisig not used", async function () {
    //   // arrange
    //   let { proxy } = await loadFixture(
    //     deployContracts
    //   );
    //   const {daoMember1 } = await getAccounts();

    //   const multiSigV2 = await deployDAOMultiSigV2();
    //   // act & assert
    //   await expect(proxy.connect(daoMember1).upgradeTo(multiSigV2.address)).to.be.revertedWith("ERROR: upgrade to zero address");
    // });
    
    // it("should revert if new address is not equal to preset address", async function () {
    //   // arrange
    //   let { proxy } = await loadFixture(
    //     deployContracts
    //   );
    //   const multiSigV2_1 = await deployDAOMultiSigV2();
    //   const multiSigV2_2= await deployDAOMultiSigV2();

    //   const {daoMember1,daoMember2,daoMember3} = await getAccounts();
    //   // act & assert
    //   // create transaction
    //   await proxy.connect(daoMember1).createUpgradeDaoMultiSigTransaction(multiSigV2_1.address);
    //   const [txs,index] = await proxy.getPendingTransactions(0, daoMember1.address)
    //   const txId = txs[index-1].id;
    //   // approve newly created transaction
    //   await proxy.connect(daoMember2).approveTransaction(txId);
    //   await proxy.connect(daoMember3).approveTransaction(txId);
    //   // assert to fail
    //   await expect(proxy.connect(daoMember3).upgradeTo(multiSigV2_2.address)).to.be.revertedWith("ERROR: implementation address don't match with preset address");
    // });
  });
});
