import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
// import { ethers } from 'ethers'
import { expect } from 'chai'
import { deployContracts, getAccounts } from '../Utils.test'
import hre, { ethers } from 'hardhat'

describe('swaper - Pausibility', function () {
  
//   to run the first test block swapper should have a fallback function
//   due to the fact that we have to deposit some ether to the swapper contract to check the ether withdraw functionality

//   it('should pause swapper', async function () {
//     // arrange
//     const provider = hre.ethers.provider
//     await provider.ready

//     const { gnosis, swapper, token1 } = await loadFixture(deployContracts)
//     const { daoMember1 } = await getAccounts()

//     const balance = 100
//     await token1.transfer(swapper.address, balance)
//     const value = ethers.utils.parseEther('1')

//     await daoMember1.sendTransaction({
//       to: swapper.address,
//       value: value
//     })

//     const add = ethers.constants.AddressZero

//     // pause swapper
//     await swapper.connect(daoMember1).pause([add, token1.address])
//     // assert if tokens withdrawn successfully
//     expect(await token1.balanceOf(gnosis.address)).to.be.equal(balance)
//     expect(await ethers.provider.getBalance(gnosis.address)).to.be.equal(value)

//     // assert if contract's paused
//     await expect(swapper.connect(daoMember1).updateFeeRatio(5)).to.be.revertedWith('Pausable: paused')
//   })
  it('should unpause swapper', async function () {
    // arrange
    const { gnosis, swapper } = await loadFixture(deployContracts)
    const { daoMember1, daoMember2, daoMember3 } = await getAccounts()

    // pause swapper
    await swapper.connect(daoMember1).pause([])
    // assert if contract's paused
    await expect(swapper.connect(daoMember1).updateFeeRatio(5)).to.be.revertedWith('Pausable: paused')
    // create multisi transaction to unpause swapper
    await gnosis.connect(daoMember1).unpauseSwapper(swapper.address) 
    await expect(swapper.unpause()).to.be.revertedWith('Pausable: not paused')
    // assert if contract's unpaused
    
  })
  it('should revert if caller is not admin', async function () {
    // arrange
    const { swapper } = await loadFixture(deployContracts)
    const { evil } = await getAccounts()
    // act & assert
    await expect(swapper.connect(evil).pause([])).to.be.revertedWith('ERROR: unauthorized caller')
  })
  it('should revert unpausing not paused contract', async function () {
    // arrange
    const { swapper } = await loadFixture(deployContracts)
    const { evil } = await getAccounts()
    // act & assert
    await expect(swapper.connect(evil).unpause()).to.be.revertedWith('Pausable: not paused')
  })
})