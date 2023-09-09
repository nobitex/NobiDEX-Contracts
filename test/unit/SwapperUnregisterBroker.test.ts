import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { expect } from 'chai'
import { deployContracts, getAccounts } from '../Utils.test'

describe('swapper', function () {
  describe('`unregisterBrokers` Functionality', async function () {
    it('should remove a broker from the mapping', async function () {
      // arrange
      const { proxy } = await loadFixture(deployContracts)
      const { daoMember1, daoMember4 } = await getAccounts()

      //check if the address is not a broker
      expect(await proxy.brokersAddresses(daoMember4.address)).to.equal(true)
      await proxy.connect(daoMember1).unregisterBrokers([daoMember4.address])
      //assert
      expect(await proxy.brokersAddresses(daoMember4.address)).to.equal(false)
    })
    it('should revert if msg.sender is not an daoMember in Admin contract', async function () {
      const { daoMember4, evil } = await getAccounts()
      // arrange
      const { proxy } = await loadFixture(deployContracts)

      //assert
      await expect(proxy.connect(evil).unregisterBrokers([daoMember4.address])).to.be.revertedWith(
        'ERROR: unauthorized caller'
      )
    })
  })
})
