import { BigNumber, Contract } from "ethers";
import hre, { ethers, upgrades } from "hardhat";
const defaultFee = 20;

export async function deployContracts(moderator: string) {
  // deploys swapper

  const { proxy } = await deploySwapper(moderator);

  const { userInfo } = await deployUserInfo();

  // deploying 4 mock erc20 tokens
  const { token1, token2, token3, token4 } = await deployERC20();
  return { proxy, userInfo, token1, token2, token3, token4 };
}
export async function deployGnosisContract() {
  // deploys swapper
  const gnosis: Contract = await deployGnosisMock();

  return { gnosis };
}

export async function getAccounts() {
  const [
    deployer,
    daoMember1,
    daoMember2,
    daoMember3,
    daoMember4,
    daoMember5,
    daoMember6,
    enduser,
    evil,
  ] = await ethers.getSigners();
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
  };
}

export async function forwardBlockTimestampByNDays(n: number) {
  const days = n * 86400;
  const blockNumBefore = await ethers.provider.getBlockNumber();
  const blockBefore = await ethers.provider.getBlock(blockNumBefore);
  const timestampBefore = blockBefore.timestamp;
  await ethers.provider.send("evm_mine", [timestampBefore + days]);
}

async function deploySwapper(multiSig: string) {
  const { daoMember1, daoMember2, daoMember3, daoMember4 } =
    await getAccounts();

  const Swapper = await ethers.getContractFactory("Swapper");
  const proxy = await upgrades.deployProxy(
    Swapper,
    [
      multiSig,
      [
        daoMember1.address,
        daoMember2.address,
        daoMember3.address,
        daoMember4.address,
      ],
      1000,
      defaultFee,
      3,
    ],
    { kind: "uups" }
  );
  await proxy.deployed();
  return { proxy };
}

export async function deployGnosisMock() {
  const { daoMember1, daoMember2, daoMember3, daoMember4 } =
    await getAccounts();

  const Gnosis = await ethers.getContractFactory("GnosisMock");
  const gnosis = await Gnosis.deploy([
    daoMember1.address,
    daoMember2.address,
    daoMember3.address,
    daoMember4.address,
  ]);
  await gnosis.deployed();
  return gnosis;
}

export async function deployProxyUpgrade() {
  const SwapperUpgrade = await ethers.getContractFactory("SwapperUpgrade");
  const swapperUpgrade = await SwapperUpgrade.deploy();
  await swapperUpgrade.deployed();
  return { swapperUpgrade };
}

export async function deployUserInfo() {
  const UserInfo = await ethers.getContractFactory("UserInfo");
  const userInfo = await UserInfo.deploy();
  await userInfo.deployed();

  return { userInfo };
}

export async function transferSomeTokensTo(
  tokens: Contract[],
  amounts: BigNumber[],
  to: string
) {
  for (let i = 0; i < tokens.length; i++) {
    await tokens[i].transfer(to, amounts[i]);
  }
}

export async function transferSomeTokens(
  tokens: Contract[],
  amounts: BigNumber[],
  to: any[]
) {
  const { deployer } = await getAccounts();
  // deploys swapper

  const { proxy } = await deploySwapper(deployer.address);
  for (let i = 0; i < tokens.length; i++) {
    await tokens[i].transfer(to[i].address, amounts[i]);
    await tokens[i].connect(to[i]).increaseAllowance(proxy.address, amounts[i]);
  }
}

export async function createOrderHash(msg: any[], swapper: Contract) {
  const { daoMember3, daoMember4 } = await getAccounts();
  const provider = hre.ethers.provider;
  await provider.ready;
  const network = await provider.getNetwork();
  const chainID = network.chainId;

  for (let i = 0; i < msg.length; i++) {
    const types = {
      OrderParameters: [
        { name: "maxFeeRatio", type: "uint16" },
        { name: "orderID", type: "uint64" },
        { name: "validUntil", type: "uint64" },
        { name: "chainID", type: "uint256" },
        { name: "ratioSellArg", type: "uint256" },
        { name: "ratioBuyArg", type: "uint256" },
        { name: "sellTokenAddress", type: "address" },
        { name: "buyTokenAddress", type: "address" },
      ],
    };

    const domain = {
      name: "Nobidex",
      version: "3",
      chainId: chainID,
      verifyingContract: swapper.address,
    };
    const makerOrderData = {
      maxFeeRatio: defaultFee,
      orderID: msg[i].makerOrderID,
      validUntil: msg[i].makerValidUntil,
      chainID: chainID,
      ratioSellArg: msg[i].makerRatioSellArg,
      ratioBuyArg: msg[i].makerRatioBuyArg,
      sellTokenAddress: msg[i].makerSellTokenAddress,
      buyTokenAddress: msg[i].takerSellTokenAddress,
    };

    const takerOrderData = {
      maxFeeRatio: defaultFee,
      orderID: msg[i].takerOrderID,
      validUntil: msg[i].takerValidUntil,
      chainID: chainID,
      ratioSellArg: msg[i].takerRatioSellArg,
      ratioBuyArg: msg[i].takerRatioBuyArg,
      sellTokenAddress: msg[i].takerSellTokenAddress,
      buyTokenAddress: msg[i].makerSellTokenAddress,
    };
    const makerSignature = await daoMember3._signTypedData(
      domain,
      types,
      makerOrderData
    );
    const takerSignature = await daoMember4._signTypedData(
      domain,
      types,
      takerOrderData
    );

    msg[i].makerSignature = makerSignature;
    msg[i].takerSignature = takerSignature;
  }

  return msg;
}

export async function createMsgHash(msg: any[], swapper: Contract) {
  const {  daoMember1 } = await getAccounts();
  const provider = hre.ethers.provider;
  await provider.ready;
  const network = await provider.getNetwork();
  const chainID = network.chainId;

  for (let i = 0; i < msg.length; i++) {
    const types = {
      OrderParameters: [
        { name: "maxFeeRatio", type: "uint16" },
        { name: "orderID", type: "uint64" },
        { name: "validUntil", type: "uint64" },
        { name: "chainID", type: "uint256" },
        { name: "ratioSellArg", type: "uint256" },
        { name: "ratioBuyArg", type: "uint256" },
        { name: "sellTokenAddress", type: "address" },
        { name: "buyTokenAddress", type: "address" },
      ],
    };

    const domain = {
      name: "Nobidex",
      version: "3",
      chainId: chainID,
      verifyingContract: swapper.address,
    };
    const OrderData = {
      maxFeeRatio: defaultFee,
      orderID: msg[i].orderID,
      validUntil: msg[i].validUntil,
      chainID: chainID,
      ratioSellArg: msg[i].ratioSellArg,
      ratioBuyArg: msg[i].ratioBuyArg,
      sellTokenAddress: msg[i].sellTokenAddress,
      buyTokenAddress: msg[i].buyTokenAddress,
    };

    const signature = await daoMember1._signTypedData(
      domain,
      types,
      OrderData
    );

    msg[i].UserSignature = signature;
  }

  return msg;
}

async function deployERC20() {
  const MockERC20 = await ethers.getContractFactory("FakeErc20");
  const token1 = await MockERC20.deploy("Token 1", "TKN1");
  const token2 = await MockERC20.deploy("Token 2", "TKN2");
  const token3 = await MockERC20.deploy("Token 3", "TKN3");
  const token4 = await MockERC20.deploy("Token 4", "TKN4");
  await token1.deployed();
  await token2.deployed();
  await token3.deployed();
  await token4.deployed();
  return { token1, token2, token3, token4 };
}
