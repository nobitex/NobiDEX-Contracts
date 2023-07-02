import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { expect } from 'chai'
import { deployContracts, getAccounts } from '../Utils.test'

describe('swapper', function () {
  describe('`unregisterBroker` Functionality', async function () {
    it('should remove a broker from the mapping', async function () {
      // arrange
      const { swapper } = await loadFixture(deployContracts)
      const { daoMember1, daoMember4 } = await getAccounts()

      //check if the address is not a broker
      expect(await swapper.brokersAddresses(daoMember4.address)).to.equal(true)
      await swapper.connect(daoMember1).unregisterBroker([daoMember4.address])
      //assert
      expect(await swapper.brokersAddresses(daoMember4.address)).to.equal(false)
    })
    it('should revert if msg.sender is not an daoMember in Admin contract', async function () {
      const { daoMember4, evil } = await getAccounts()
      // arrange
      const { swapper } = await loadFixture(deployContracts)

      //assert
      await expect(swapper.connect(evil).unregisterBroker([daoMember4.address])).to.be.revertedWith(
        'ERROR: unauthorized caller'
      )
    })
  })
})
