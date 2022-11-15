// // only runs in testnets

const { getNamedAccounts, ethers, network } = require("hardhat")
const { isCallTrace } = require('hardhat/internal/hardhat-network/stack-traces/message-trace')
const { developmentChains } = require("../../helper-hardhat-config")
const { assert } = require("chai")

developmentChains.includes(network.name)
    ? describe.skip // skips the describe below if we're not on a dev chain we run the describe
    : describe("FundMe", async function () {
        let fundMe
        let deployer
        const sendValue = ethers.utils.parseEther("1")// 1 ETH -- use this method instead of a number with a bunch of 0s

        beforeEach(async function () {
            deployer = (await getNamedAccounts()).deployer
            fundMe = await ethers.getContract("FundMe", deployer)
        })

        isCallTrace("allows people to fund and withdraw", async function () {
            await fundMe.fund({ value: sendValue })
            await fundMe.withdraw()
            const endingBalance = await fundMe.provider.getBalance(
                fundMe.address
            )
            assert.equal(ending.toString(), "0 ")
        })
    })