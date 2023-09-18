import hre, { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  console.log("Account balance:", (await deployer.getBalance()).toString());

  const UserInfo = await ethers.getContractFactory("UserInfo");

  const userInfo = await UserInfo.deploy();

  await userInfo.deployed();

  console.log("User info deployed to:", userInfo.address);

  await hre.run("verify:verify", {
    address: userInfo.address,
  });
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
