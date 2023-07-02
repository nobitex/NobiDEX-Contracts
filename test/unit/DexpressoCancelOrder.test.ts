import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { expect } from 'chai'
import hre from 'hardhat'
import { deployContracts, getAccounts, createMsgHash, transferSomeTokens } from '../Utils.test'
import { ethers } from 'ethers'

describe('Dexoresso', function () {
  describe('`cancelOrder` Functionality', async function () {
    it('should cancel an order with the given ID', async function () {
      // arrange
      const { dexpresso, token3, token4 } = await loadFixture(deployContracts)
      const { deployer, daoMember1, daoMember3, daoMember4 } = await getAccounts()

      const provider = hre.ethers.provider
      await provider.ready
      const network = await provider.getNetwork()
      const chainID = network.chainId


      let MatchedOrders;
      
      MatchedOrders = [
        {
          //successful order
          makerFeeRatio: 10,
          takerFeeRatio: 20,
          makerOrderID: 2356,
          takerOrderID: 3154,
          chainID: 5,
          makerValidUntil: 100,
          takerValidUntil: 100,
          matchID: 1,
          makerRatioSellArg: 3n * 10n ** 18n,
          makerRatioBuyArg: 600n * 10n ** 18n,
          takerRatioSellArg: 650n * 10n ** 18n,
          takerRatioBuyArg: 3n * 10n ** 18n,
          makerTotalSellAmount: 1n * 10n ** 18n,
          takerTotalSellAmount: 200n * 10n ** 18n,
          makerSellTokenAddress: token3.address,
          takerSellTokenAddress: token4.address,
          makerUserAddress: daoMember3.address,
          takerUserAddress: daoMember4.address,
        },
      ]
      
      MatchedOrders = await createMsgHash(MatchedOrders)
      // console.log(MatchedOrders)
      
        // base transfers
        const _amounts = [
          ethers.BigNumber.from(1000n * 10n ** 18n),
          ethers.BigNumber.from(1000n * 10n ** 18n),
          ethers.BigNumber.from(1000n * 10n ** 18n),
          ethers.BigNumber.from(1000n * 10n ** 18n),
        ]
        const _tokens = [token3, token4]
  
        const _callers = [daoMember3, daoMember4]
  
        await transferSomeTokens(_tokens, _amounts, _callers)
        
        // base allowances
    
        await token3.connect(daoMember3).increaseAllowance(dexpresso.address, 1000n * 10n ** 18n)
        await token4.connect(daoMember4).increaseAllowance(dexpresso.address, 1000n * 10n ** 18n)
        

      // adding caller to the brokerAddressees mapping
      await dexpresso.connect(daoMember1).registerBroker([deployer.address])
      // cancelling the makers order
      const cancelOrders = 
        {
          maxFeeRatio: 20,
          orderID: 2356,
          validUntil: 100,
          chainID: chainID,
          ratioSellArg: 3n * 10n ** 18n,
          ratioBuyArg: 600n * 10n ** 18n,
          sellTokenAddress: token3.address,
          buyTokenAddress: token4.address,
        }
      
      const makerSignature =  MatchedOrders[0].makerSignature;
      const makerOrderID = 2356

      
      const tx1 = await dexpresso.connect(daoMember3).removeOrder(cancelOrders, makerSignature, makerOrderID)
     
      // getting the events data
      
      const transactionReceipt1 = await tx1.wait()
      
      const events1 = transactionReceipt1.events
      
      //predict the event data
      // const makerOrderID = 2356
      
      //assert
      // compare the event data with the predicted values
      expect(events1[0].args[0]).to.equals(daoMember3.address)
      expect(events1[0].args[1]).to.equals(makerOrderID)
      
      // broadcast the order to the contract
     
      const tx2 = await dexpresso.connect(deployer).Swap(MatchedOrders)
      
      // getting the events data
      const transactionReceipt2 = await tx2.wait()
      const events2 = transactionReceipt2.events
      const expectedMatchID = ethers.BigNumber.from(1)
      //predict the event data
      const expectedStatusCode = 410

      //assert
      // compare the event data with the predicted values
      expect(events2[0].args[0][0][0]).to.equals(expectedMatchID)
      expect(events2[0].args[0][0][1]).to.equals(expectedStatusCode)
    })
  })
})