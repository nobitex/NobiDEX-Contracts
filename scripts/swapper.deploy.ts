import hre, { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  console.log("Account balance:", (await deployer.getBalance()).toString());

  const brokerAddress = [""]
  //Gnosis
  const Moderator = "";
  const FeeRatioDenominator = ""
  const version = ""
  const maxFeeRatio = ""

  if (!Moderator) {
    throw new Error("Moderator is not defined");
  }
  if (!maxFeeRatio) {
    throw new Error("maxFeeRatio is not defined");
  }
  if (!FeeRatioDenominator) {
    throw new Error("FeeRatioDenominator is not defined");
  }
  if (!version) {
    throw new Error("version is not defined");
  }
  if (!brokerAddress) {
    throw new Error("brokerAddress is not defined");
  }
  
  const Swapper = await ethers.getContractFactory("Swapper");

  const swapper = await Swapper.deploy(
    Moderator,
    brokerAddress,
    FeeRatioDenominator,
    maxFeeRatio,
    version
  );

  await swapper.deployed();

  console.log("Swapper deployed to:", swapper.address);

  await hre.run("verify:verify", {
    address: swapper.address,
    constructorArguments: [Moderator,
      brokerAddress,
      FeeRatioDenominator,
      maxFeeRatio,
      version],
  });
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
