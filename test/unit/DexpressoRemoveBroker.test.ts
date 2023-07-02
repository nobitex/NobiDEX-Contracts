import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { expect } from 'chai'
import { deployContracts, getAccounts } from '../Utils.test'

describe('Dexoresso', function () {
  describe('`removeBroker` Functionality', async function () {
    it('should remove a broker from the mapping', async function () {
      // arrange
      const { dexpresso } = await loadFixture(deployContracts)
      const { daoMember1, daoMember4 } = await getAccounts()

      //check if the address is not a broker
      expect(await dexpresso.brokersAddresses(daoMember4.address)).to.equal(true)
      await dexpresso.connect(daoMember1).unregisterBroker([daoMember4.address])
      //assert
      expect(await dexpresso.brokersAddresses(daoMember4.address)).to.equal(false)
    })
    it('should revert if msg.sender is not an daoMember in Admin contract', async function () {
      const { daoMember4, evil } = await getAccounts()
      // arrange
      const { dexpresso } = await loadFixture(deployContracts)

      //assert
      await expect(dexpresso.connect(evil).unregisterBroker([daoMember4.address])).to.be.revertedWith(
        'ERROR: unauthorized caller'
      )
    })
  })
})
