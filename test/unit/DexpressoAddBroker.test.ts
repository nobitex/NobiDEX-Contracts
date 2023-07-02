import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { expect } from 'chai'
import { deployContracts, getAccounts } from '../Utils.test'

describe('Dexoresso', function () {
  describe('`addBroker` Functionality', async function () {
    it("should add a new broker to the 'brokersAdresses' mapping", async function () {
      // arrange
      const { dexpresso } = await loadFixture(deployContracts)
      const { daoMember1, daoMember5 } = await getAccounts()

      //check if the address is not a broker
      expect(await dexpresso.brokersAddresses(daoMember5.address)).to.equal(false)
      await dexpresso.connect(daoMember1).registerBroker([daoMember5.address])
      //assert
      expect(await dexpresso.brokersAddresses(daoMember5.address)).to.equal(true)
    })
    it('should revert if msg.sender is not an daoMember in Admin contract', async function () {
      const { daoMember5, evil } = await getAccounts()
      // arrange
      const { dexpresso } = await loadFixture(deployContracts)

      //assert
      await expect(dexpresso.connect(evil).registerBroker([daoMember5.address])).to.be.revertedWith(
        'ERROR: unauthorized caller'
      )
    })
  })
})
