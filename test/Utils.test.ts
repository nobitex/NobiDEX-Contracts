import { BigNumber, Contract } from 'ethers'
import hre, { ethers } from 'hardhat'
const defaultFee = 20


export async function deployContracts() {

  // deploys swapper
  const gnosis: Contract = await deployGnosisMock()

  const swapper: Contract = await deploySwapper(gnosis.address)

  // deploying 4 mock erc20 tokens
  const { token1, token2, token3, token4 } = await deployERC20()
  return { gnosis, swapper, token1, token2, token3, token4 }
}

export async function getAccounts() {
  const [deployer, daoMember1, daoMember2, daoMember3, daoMember4, daoMember5, daoMember6, enduser, evil] =
    await ethers.getSigners()
  return {
    deployer,
    daoMember1,
    daoMember2,
    daoMember3,
    daoMember4,
    daoMember5,
    daoMember6,
    enduser,
    evil,
  }
}

export async function forwardBlockTimestampByNDays(n: number) {
  const days = n * 86400
  const blockNumBefore = await ethers.provider.getBlockNumber()
  const blockBefore = await ethers.provider.getBlock(blockNumBefore)
  const timestampBefore = blockBefore.timestamp
  await ethers.provider.send('evm_mine', [timestampBefore + days])
}



async function deploySwapper(multiSig: string) {
  const { daoMember1, daoMember2, daoMember3, daoMember4 } = await getAccounts()

  const Swapper = await ethers.getContractFactory('swapper')
  const swapper = await Swapper.deploy(defaultFee, multiSig, [
    daoMember1.address,
    daoMember2.address,
    daoMember3.address,
    daoMember4.address,
  ])
  await swapper.deployed()
  return swapper
}

async function deployGnosisMock() {
  const { daoMember1, daoMember2, daoMember3, daoMember4 } = await getAccounts()

  const Gnosis = await ethers.getContractFactory('GnosisMock')
  const gnosis = await Gnosis.deploy([
    daoMember1.address,
    daoMember2.address,
    daoMember3.address,
    daoMember4.address,
  ])
  await gnosis.deployed()
  return gnosis
}



export async function transferSomeTokensTo(tokens: Contract[], amounts: BigNumber[], to: string) {
  for (let i = 0; i < tokens.length; i++) {
    await tokens[i].transfer(to, amounts[i])
  }
}

export async function transferSomeTokens(tokens: Contract[], amounts: BigNumber[], to: any[]) {

  const { deployer } = await getAccounts()
  // deploys swapper

  const Swapper: Contract = await deploySwapper(deployer.address)
  for (let i = 0; i < tokens.length; i++) {
    await tokens[i].transfer(to[i].address, amounts[i])
    await tokens[i].connect(to[i]).increaseAllowance(Swapper.address, amounts[i])
  }
}

export async function createMsgHash(msg: any[]) {
  const { daoMember3, daoMember4 } = await getAccounts()
  const provider = hre.ethers.provider
  await provider.ready
  const network = await provider.getNetwork()
  const chainID = network.chainId

  for (let i = 0; i < msg.length; i++) {
    const makermessageHash = ethers.utils.solidityKeccak256(
      ['uint16', 'uint64', 'uint64', 'uint256', 'uint256', 'uint256', 'address', 'address'],
      [
        defaultFee,
        msg[i].makerOrderID,
        msg[i].makerValidUntil,
        chainID,
        msg[i].makerRatioSellArg,
        msg[i].makerRatioBuyArg,
        msg[i].makerSellTokenAddress,
        msg[i].takerSellTokenAddress,
      ]
    )
    const takermessageHash = ethers.utils.solidityKeccak256(
      ['uint16', 'uint64', 'uint64', 'uint256', 'uint256', 'uint256', 'address', 'address'],
      [
        defaultFee,
        msg[i].takerOrderID,
        msg[i].takerValidUntil,
        chainID,
        msg[i].takerRatioSellArg,
        msg[i].takerRatioBuyArg,
        msg[i].takerSellTokenAddress,
        msg[i].makerSellTokenAddress,
      ]
    )


    const makerMessageHashBinary = ethers.utils.arrayify(makermessageHash)
    const takerMessageHashBinary = ethers.utils.arrayify(takermessageHash)

    const makerSignature = await daoMember3.signMessage(makerMessageHashBinary)
    const takerSignature = await daoMember4.signMessage(takerMessageHashBinary)


    msg[i].makerSignature = makerSignature
    msg[i].takerSignature = takerSignature
  }

  return msg
}

async function deployERC20() {
  const MockERC20 = await ethers.getContractFactory('FakeErc20')
  const token1 = await MockERC20.deploy('Token 1', 'TKN1')
  const token2 = await MockERC20.deploy('Token 2', 'TKN2')
  const token3 = await MockERC20.deploy('Token 3', 'TKN3')
  const token4 = await MockERC20.deploy('Token 4', 'TKN4')
  await token1.deployed()
  await token2.deployed()
  await token3.deployed()
  await token4.deployed()
  return { token1, token2, token3, token4 }
}
