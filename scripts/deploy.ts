import hre, { ethers } from 'hardhat'

async function main() {
  const [deployer] = await ethers.getSigners()

  console.log('Deploying contracts with the account:', deployer.address)

  console.log('Account balance:', (await deployer.getBalance()).toString())

  const brokerAddress = [
    '0x7515ab9833921b20737E1a6286Cf20F93CB96D74',
    '0x0B8c3a469cc808442Aab0253C3DfdeC7C34bF0E2',
    '0xD91c89CA6C37Bd57f1D5d762225C951E7631d90f',
  ]
  const daoMultiSigAddress = "0x7515ab9833921b20737E1a6286Cf20F93CB96D74"
  const maxFeeRatio = 30 // it means 20/1000 %

  if (!daoMultiSigAddress) {
    throw new Error('daoMultiSigAddress is not defined')
  }
  const Dexpresso = await ethers.getContractFactory('swapper')

  const dexpresso = await Dexpresso.deploy(maxFeeRatio, daoMultiSigAddress, brokerAddress)

  await dexpresso.deployed()

  console.log('Dexpresso deployed to:', dexpresso.address)

  await hre.run('verify:verify', {
    address: dexpresso.address,
    constructorArguments: [30, daoMultiSigAddress, brokerAddress],
  })
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
