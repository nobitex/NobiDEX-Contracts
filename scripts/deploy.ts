import hre, { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  console.log("Account balance:", (await deployer.getBalance()).toString());

  const brokerAddress = [
    "0x5A98A7554592a09E2985c9e6F2d447E7A2B1FE6C",
    "0x14be4Dc6E2e7562eB80F20fA4f8dbD072B8a5667",
    "0xE90814272dc69bA6Cdf45893b818b7AB28effA3A",
    "0x6500406650A06fA5c5ef8edDEe7e350f859fe3b4",
    "0x84A4eeD02695C113E703991C68a6cf3f4e3b6407",
  ];
  const Moderator = "0x5A98A7554592a09E2985c9e6F2d447E7A2B1FE6C";
  const maxFeeRatio = 30; // it means 20/1000 %

  if (!Moderator) {
    throw new Error("Moderator is not defined");
  }
  const Swapper = await ethers.getContractFactory("swapper");

  const swapper = await Swapper.deploy(
    maxFeeRatio,
    Moderator,
    brokerAddress
  );

  await swapper.deployed();

  console.log("Swapper deployed to:", swapper.address);

  await hre.run("verify:verify", {
    address: swapper.address,
    constructorArguments: [30, Moderator, brokerAddress],
  });
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
