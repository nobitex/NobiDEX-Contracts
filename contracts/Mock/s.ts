// importing the required modules from ethers.js
const { providers, utils, Contract } = require("ethers");

// importing ABI for interface of ERC1271 so we can call the `isValidSignature` function
const IERC1271Abi = [{"inputs":[{"internalType":"address[]","name":"addrs","type":"address[]"}],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"},{"indexed":false,"internalType":"bytes","name":"data","type":"bytes"},{"indexed":false,"internalType":"bytes","name":"returnData","type":"bytes"}],"name":"LogErr","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"addr","type":"address"},{"indexed":false,"internalType":"bytes32","name":"priv","type":"bytes32"}],"name":"LogPrivilegeChanged","type":"event"},{"stateMutability":"payable","type":"fallback"},{"inputs":[{"components":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"},{"internalType":"bytes","name":"data","type":"bytes"}],"internalType":"struct Identity.Transaction[]","name":"txns","type":"tuple[]"},{"internalType":"bytes","name":"signature","type":"bytes"}],"name":"execute","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"components":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"},{"internalType":"bytes","name":"data","type":"bytes"}],"internalType":"struct Identity.Transaction[]","name":"txns","type":"tuple[]"}],"name":"executeBySelf","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"components":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"},{"internalType":"bytes","name":"data","type":"bytes"}],"internalType":"struct Identity.Transaction[]","name":"txns","type":"tuple[]"}],"name":"executeBySender","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"hash","type":"bytes32"},{"internalType":"bytes","name":"signature","type":"bytes"}],"name":"isValidSignature","outputs":[{"internalType":"bytes4","name":"","type":"bytes4"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"nonce","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"privileges","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"addr","type":"address"},{"internalType":"bytes32","name":"priv","type":"bytes32"}],"name":"setAddrPrivilege","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes4","name":"interfaceID","type":"bytes4"}],"name":"supportsInterface","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"pure","type":"function"},{"inputs":[{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"tipMiner","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"},{"internalType":"bytes","name":"data","type":"bytes"}],"name":"tryCatch","outputs":[],"stateMutability":"nonpayable","type":"function"},{"stateMutability":"payable","type":"receive"}]

// This is a constant magic value defined in EIP-1271 that's returned when the signature is valid
const MAGICVALUE = 0x1626ba7e;

// function to check if a signature is valid
const isValidSignature = async (signingAddress, message, signature) => {
  const hash = utils.hashMessage(message); // hash the message
  const apiKey = "demo" // replace with your Alchemy API key for the network you are verifying the signature for, in this case Polygon Mainnet
  const provider = new providers.JsonRpcProvider(
    `https://polygon-mainnet.g.alchemy.com/v2/${apiKey}`
  ); // get your provider
  const bytecode = await provider.getCode(signingAddress); // get the bytecode
  const isSmartContract = bytecode && utils.hexStripZeros(bytecode) !== "0x"; // check if it is a smart contract wallet

  if (isSmartContract) {
    // verify the message for a decentralized account (contract wallet)
    const contractWallet = new Contract(signingAddress, IERC1271Abi, provider); // make an instance for the contact wallet
    const verification = await contractWallet.isValidSignature(hash, signature); // verify if the signature is valid using the `isValidSignature` function
    console.log("Message is verified?", verification === MAGICVALUE); // log if the signature is valid
    return verification === MAGICVALUE; // return true or false based on if the signature is valid or not
  } else {
    // verify the message for an externally owned account (EOA) using the recovery algorithm
    const sig = ethers.utils.splitSignature(signature);
    const recovered = await contract.verifyHash(hash, sig.v, sig.r, sig.s);
    console.log("Message is verified?", recovered === signingAddress);
    return recovered === signingAddress;
  }
};

async function main() {
  let isValid = await isValidSignature(
    "0x4836a472ab1dd406ecb8d0f933a985541ee3921f",
    "0x787177",
    "0xc0f8db6019888d87a0afc1299e81ef45d3abce64f63072c8d7a6ef00f5f82c1522958ff110afa98b8c0d23b558376db1d2fbab4944e708f8bf6dc7b977ee07201b00"
  );

  console.log(isValid);
}

main();