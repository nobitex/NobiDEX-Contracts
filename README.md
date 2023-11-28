# NobiDEX

NobiDEX is an orderbook base decentralized exchange and the NobiDEX contracts duty is to check order validity and fairness of the matched orders and execute the swap.

## Smart Contracts

This project includes the following smart contracts:
### Main project contracts
- [Swapper](./contracts/Exchange/Swapper.sol)
- [UserInfo](./contracts/Info/UserInfo.sol)

### Mock contracts
- [FakeErc20](contracts/mock/FakeErc20.sol)
- [GnosisMock](contracts/mock/GnosisMock.sol)
- [SmartWallet](contracts/mock/SmartWallet.sol)

### `Swapper`

Swapper contract is the platform that perform the fairness checks. In case all the checks have passes, then the contract performs the swaps of that tokens between users and the exchange fee is send to the Moderator address as it is the moderator of Swapper contract, this is done through the main function of the contract called `Swap`.

In NobiDEX, we introduce an essential function called `Swap`, which plays a crucial role in facilitating token swaps on the blockchain. The execution of this function is restricted to a specific set of addresses through a mapping-based modifier called `isBroker`. These addresses represent the direct users of the contract who possess the privilege to initiate token swaps.

By implementing this mapping-based modifier, NobiDEX ensures that only authorized addresses can invoke the Swap function and perform token swaps on-chain. This approach adds an extra layer of security and control over the swapping process.

However, before executing a swap, the orders must pass through rigorous security checks within the NobiDEX's Swapper contract. These checks assess the validity and fairness of the orders to prevent any malicious or unauthorized activities. The swap can only be executed if the orders pass these security checks

By limiting the direct usage of the contract to specific addresses and enforcing security checks, NobiDEX provides a robust and secure platform for on-chain token swapping. This design ensures that only trusted users can execute swaps, maintaining the integrity and reliability of the platform.
You should contact us if you wish to become a broker in NobiDEX swapper contract.

There is no deposit design in the swapper contract, Therefore, users should grant approval to the swapper contract by providing it with an amount of the token equal to or greater than the specified order amount before initiating the swap. As a result approach, the platform becomes more trustless.

The NobiDEX's Swapper contract implements robust security checks to ensure that orders are matched and executed in a fair and reliable manner, instilling confidence among users.
Let's go through our security checks:
- `Transfer Feasibility`
This security check ensures that the transfer of tokens is feasible by verifying the user's balance and approval for the swap execution.
- `Order Canceled`
This security check confirms that the order has not been canceled through the off-chain cancelOrder option, and allows users to prevent an order from being executed directly from the exchange contract.
- `Order validity`
 This security check verifies that the specified time limit for the order has not elapsed before executing the swap.
- `Price Fairness`
This security check ensures that the best price is selected for an order. For a buy order, it is either the price chosen by the user or lower, while for a sell order, it is the price chosen by the user or higher.
- `Price Relativity`
This security check guarantees that the maker's price is always set as the execution price of the swap.
- `Fee Fairness`
This security check verifies that the fee charged to the user is less than or equal to the maximum fee percentage agreed upon by the user.
- `Signature validation`
This security check confirms that the data used to execute the swap is the same as the data signed by the user at the time of order creation. This validation is performed by the ECDSA smart contract.


## `Moderator`

Moderators can be EOA addresses or multi-signature wallets. We use a multi-signature wallet as a moderator in Arbitrum blockchain, and an EOA wallet in other chains.

All of the fees acquired from the swaps will get transferred into the moderator address and the DAO Members have the ability to create a withdraw request. If a specific amount of DAO Members approve, the request is considered as confirmed and will execute. 

### `FakeErc20`
The FakeErc20 is a simple erc20 token we use to run our tests.

### `UserInfo`
The UserInfo contract provides you with details about the cancelled status of an specific order, the chianID, the allowance and balance of an specific token, code size and block number in one transaction which can be used for testing purposes and verifying a matchedOrder detail before calling the swap function on the contract. 

## Setup

To set up the project, follow these steps:

1. Clone the repository:
git clone https://github.com/Nobitex/NobiDEX.git

2. Install dependencies:
It is possible to install the dependencies using popular package managers, such as `yarn` and `npm`.

Example:

```CMD
yarn install
```

3. Set up the environment variables. Create a `.env` file in the root of the project and add the following variables:

| Variable Name | Description |
|----------------------|--------------------------------------|
| PRIVATE_KEY | Contract deployment private key |
| ETHERSCAN_API_KEY | Etherscan API key for verifying contracts |
| ETH_GOERLI_URL | URL for Ethereum Goerli node |
| ETH_MAIN_URL | URL for Ethereum mainnet node |
| ARBISCAN_API_KEY | ArbiScan API key for verifying contracts |
| ARB_TEST_URL | URL for Arbitrum testnet node |
| ARB_MAIN_URL | URL for Arbitrum mainnet node |
| BSCSCAN_API_KEY | BscScan API key for verifying contracts |
| BSC_TEST_URL | URL for Binance Smart Chain testnet node |
| BSC_MAIN_URL | URL for Binance Smart Chain mainnet node |
| PLYGNSCAN_API_KEY | PolygonScan API key for verifying contracts |
| PLYGN_TEST_URL | URL for Polygon testnet node |
| PLYGN_MAIN_URL | URL for Polygon mainnet node |
| AVALANCHE_API_KEY | Avalanche API key for verifying contracts |
| AVALANCHE_TEST_URL | URL for Avalanche testnet node |
| AVALANCHE_MAIN_URL | URL for Avalanche mainnet node |
| FUJI_URL| URL for Avalanche Fuji node |
| FANTOM_API_KEY | Fantom API key for verifying contracts |
| FANTOM_TEST_URL | URL for Fantom testnet node |
| FANTOM_MAIN_URL | URL for Fantom mainnet node |
| HARMONY_API_KEY | Harmony API key for verifying contracts |
| HARMONY_TEST_URL | URL for Harmony testnet node |
| HARMONY_MAIN_URL | URL for Harmony mainnet node |
| OPTIMISM_API_KEY | Optimism API key for verifying contracts |
| OPTIMISM_TEST_URL | URL for Optimism testnet node |
| OPTIMISM_MAIN_URL | URL for Optimism mainnet node |
| GNOSIS_API_KEY | Gnosis API key for verifying contracts |
| GNOSIS_TEST_URL | URL for Gnosis testnet node |
| GNOSIS_MAIN_URL | URL for Gnosis mainnet node |
| ZK_TEST_URL | URL for zkSync testnet node |
| ZK_MAIN_URL | URL for zkSync mainnet node |

4. compiling the contracts:

In this project we use both [hardhat](https://hardhat.org/) and [foundry](https://book.getfoundry.sh/) to take advantage of their features.

Compiling the contracts with hardhat:
```CMD
npx hardhat compile
```
Compiling the contracts with foundry:
```CMD
forge built
```


## Scripts

This project includes the following scripts:

- `swapper.deploy`: Deploys and verifies the Swapper contract.
- `user-info.deploy`: Deploys and verifies the UserInfo contract.

Run the following command to deploy the contracts:

```CMD
npx hardhat run <ScriptsName> --network <NetworkName>
```

change the `ScriptsName` with the name of the script you want to use,
and change the `NetworkName` to the network name set in the hardhat.config file you want to deploy to.


## Tests

While we have Hardhat and Foundry in our project, the majority of our tests are still written using Hardhat.

For testing the smart contracts in Hardhat we use Mocha and Chai.
Chai provides an assertion library that offers a range of assertion styles to make tests more expressive and readable, while Mocha provides a simple and expressive testing structure. Together, they make it easy to write clear and comprehensive tests for your smart contracts.

`Utils.test` is the set up for every test we perform.
NobiDEX has a test file for every function, testing every single possibility to ensure everything works as expected.

To run the tests, use the following command:
```CMD
npx hardhat test
```

To run a specific test, use the following command:
```CMD
npx hardhat test test/uint/<testFileName>/<testName>
```
change the `testFileName` with the name of the contract test file you want to run,
change the `testName` with the name of the test you want to run,

to run the foundry tests:
```CMD
forge test
```
to get the gas report of a test:
```CMD
forge test --gas-report 
```

### VS Code extensions

- **`ESLint`: **We use [ESLint](https://eslint.org/) as our linter tool, you can lint your code using the provided yarn command down below, but in order to receive real-time feedback as you write your code and handle mistakes immediately, you can use the [VS Code ESLint extension](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint).

Running linter on source code:
```CMD
yarn lint
```
Fixing lint issues in source code:
```CMD
yarn lint:fix
```

- **`Slither`: **We use [Slither](https://github.com/crytic/slither) as our static security analysis tool. It runs a suite of vulnerability detectors, prints information about contract details visually. Slither enables you to find vulnerabilities, enhance your code comprehension, and quickly prototype custom analyses.
You can use the [VS Code Slither extension](https://marketplace.visualstudio.com/items?itemName=trailofbits.slither-vscode).

Run Slither on a Hardhat/Foundry/Dapp/Brownie application:
```CMD
slither .
```
Run Slither on a single file:
```CMD
slither <tests/uninitialized.sol>
```
change the `uninitialized` with the name of the file you want to analyze.

## Licenses

This project is released under the following licenses:

- MIT License (for the main project code)
- Creative Commons Attribution 3.0 International License (for the documentation)

### Creative Commons Attribution 3.0 International License

[The CC BY 3.0 License](LICENSE.txt)


## Commit message conventions

### Branch Name

Template:
```CMD
<SERVICE_NAME>/<GITHUB_TASK_ID>-<SHORT_SUMMARY>(optional)
```

Example:

```CMD
contract/TASK-98-add-slither
```

### Commit Message

```CMD
<Feature/Debug/Refactor/Config/Hotfix>(<SERVICE_NAME>): <MESSAGE>
```

Example:

```CMD
Refactor(contract): do some gas efficiency related task
```

## Naming

We use the NestJS naming convention (Which is inspired by Angular).

### File:

We use kebab-case naming for files with more than one word. (event-lister.js)

For frequent types/functionality of files (X), we use "file-name.X.ts". X must look like this:
- test
- services
- provider
- handler
- interface
- type
- enum
- etc.

## Contributions

Contributions to this project are welcome. Feel free to submit a pull request or open an issue if you encounter any problems or have any questions.