// import { Contract } from "ethers";
// import hre, { ethers } from "hardhat";

// async function main() {
//   const [deployer] = await ethers.getSigners();

//   console.log("Deploying contracts with the account:", deployer.address);

//   console.log("Account balance:", (await deployer.getBalance()).toString());

//   let proxy;

//   if (!proxy) {
//     throw new Error("proxy is not defined");
//   }

//   // deploy the new implementation

//   const SwapperUpgrade = await ethers.getContractFactory("SwapperUpgrade");

//   const swapperUpgrade = await SwapperUpgrade.deploy();

//   await swapperUpgrade.deployed();

//   console.log("Swapper deployed to:", swapperUpgrade.address);

//   //deploy the mock gnosis

//   const DaoAddresses = [deployer.address]
//   const Gnosis = await ethers.getContractFactory("GnosisMock");
//   const gnosis = await Gnosis.deploy(DaoAddresses);
//   await gnosis.deployed();

//   // upgrade the contract

//   await gnosis.upgradeSwapper(proxy, swapperUpgrade.address);

//   const swapperUpgraded = await ethers.getContractFactory("SwapperUpgrade");
//   proxy = await swapperUpgraded.attach(proxy);

//   await hre.run("verify:verify", {
//     address: swapperUpgrade.address,
//   });
// }

// // We recommend this pattern to be able to use async/await everywhere
// // and properly handle errors.
// main().catch((error) => {
//   console.error(error);
//   process.exitCode = 1;
// });
