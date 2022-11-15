// only runs in development chains
const { deployments, ethers, network } = require("hardhat")
const { assert, expect } = require("chai")
const { developmentChains } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip // skips the describe below if we're not on a dev chain we run the describe
    : describe("FundMe", function () {
        let fundMe
        let deployer
        let mockV3Aggregator
        const sendValue = ethers.utils.parseEther("1")// 1 ETH -- use this method instead of a number with a bunch of 0s
        beforeEach(async function () {
            // deploy our FundMe contract
            // using Hardhat-deploy
            // const accounts = await ethers.getSigners()
            // const accountZero = accounts[0]
            deployer = (await getNamedAccounts()).deployer
            await deployments.fixture(["all"])
            fundMe = await ethers.getContract("FundMe", deployer)
            mockV3Aggregator = await ethers.getContract("MockV3Aggregator", deployer)
        })

        describe("constructor", async function () {
            it("sets the aggregator address correctly", async function () {
                const response = await fundMe.getPriceFeed()
                assert.equal(response, mockV3Aggregator.address)
            })
        })

        describe("fund", async function () {
            it("fails if you dont send enough ETH", async function () {
                await expect(fundMe.fund()).to.be.revertedWith("you need to spend more ETH") // expect is from Waffle
            })
            it("updated the amount funded data structure", async function () {
                await fundMe.fund({ value: sendValue })
                const response = await fundMe.getAddressAmountFunded(deployer)
                assert.equal(response.toString(), sendValue.toString())
            })
            it("adds funder to array of getFunder", async function () {
                await fundMe.fund({ value: sendValue })
                const funder = await fundMe.getFunder(0)
                assert.equal(funder, deployer)
            })
        })

        describe("withdraw", async function () {
            // we need money on our wallet to test the withdraw
            beforeEach(async function () {
                await fundMe.fund({ value: sendValue })
            })

            it("withdraw ETH from a single founder", async function () {
                // 1. arrange
                const startingFundMeBalance = await fundMe.provider.getBalance(
                    fundMe.address
                )
                const startingDeployerBalance = await fundMe.provider.getBalance(
                    deployer
                )

                // 2.act
                const transactionResponse = await fundMe.withdraw()
                const transactionReceipt = await transactionResponse.wait(1)

                // gas cost
                const { gasUsed, effectiveGasPrice } = transactionReceipt
                const gasCost = gasUsed.mul(effectiveGasPrice) // both variables are BigNumbers we used .mul to multiply them

                const endingFundMeBalance = await fundMe.provider.getBalance(
                    fundMe.address
                )
                const endingDeployerBalance = await fundMe.provider.getBalance(
                    deployer
                )

                // 3. assert
                assert.equal(endingFundMeBalance, 0) // 0 since we withdrew all the ETH
                assert.equal(startingFundMeBalance.add(startingDeployerBalance.toString()),   // we are using the add function since we're calling startingFundMeBalance from the blockchain and it comes by default as a BigNumber 
                    endingDeployerBalance.add(gasCost).toString()) // adding the gas fee that was generated when we called fundMe.withdraw() by our deployer
            })

            it("allows us to withdraw with multiple getFunder", async function () {
                const accounts = await ethers.getSigners()
                for (let i = 1; i < 6; i += 1) { // we start with 1 since 0 is the deployer
                    const fundMeConnectedContract = await fundMe.connect(
                        accounts[i]
                    )
                    await fundMeConnectedContract.fund({ value: sendValue })
                }
                const startingFundMeBalance = await fundMe.provider.getBalance(
                    fundMe.address
                )
                const startingDeployerBalance = await fundMe.provider.getBalance(
                    deployer
                )
                // 1. act
                const transactionResponse = await fundMe.withdraw()
                const transactionReceipt = await transactionResponse.wait(1)

                // gas cost
                const { gasUsed, effectiveGasPrice } = transactionReceipt
                const gasCost = gasUsed.mul(effectiveGasPrice) // both variables are BigNumbers we used .mul to multiply them

                const endingFundMeBalance = await fundMe.provider.getBalance(
                    fundMe.address
                )
                const endingDeployerBalance = await fundMe.provider.getBalance(
                    deployer
                )

                // 3. assert
                assert.equal(endingFundMeBalance, 0) // 0 since we withdrew all the ETH
                assert.equal(startingFundMeBalance.add(startingDeployerBalance.toString()),   // we are using the add function since we're calling startingFundMeBalance from the blockchain and it comes by default as a BigNumber 
                    endingDeployerBalance.add(gasCost).toString()) // adding the gas fee that was generated when we called fundMe.withdraw() by our deployer

                // make sure that the getFunder are reset properly
                await expect(fundMe.getFunder(0)).to.be.reverted

                for (let i = 0; i < 6; i += 1) {
                    assert.equal(
                        await fundMe.getAddressAmountFunded(accounts[i].address), 0
                    )
                }
            })

            it("only allows the owner to withdraw", async function () {
                const accounts = await ethers.getSigners()
                const attacker = accounts[1]
                const attackerConnectedContract = await fundMe.connect(attacker)
                await expect(attackerConnectedContract.withdraw()).to.be.revertedWith("FundMe__NotOwner")
            })

            it("cheaper withdraw testing...", async function () {
                const accounts = await ethers.getSigners()
                for (let i = 1; i < 6; i += 1) { // we start with 1 since 0 is the deployer
                    const fundMeConnectedContract = await fundMe.connect(
                        accounts[i]
                    )
                    await fundMeConnectedContract.fund({ value: sendValue })
                }
                const startingFundMeBalance = await fundMe.provider.getBalance(
                    fundMe.address
                )
                const startingDeployerBalance = await fundMe.provider.getBalance(
                    deployer
                )
                // 1. act
                const transactionResponse = await fundMe.cheaperWithdraw()
                const transactionReceipt = await transactionResponse.wait(1)

                // gas cost
                const { gasUsed, effectiveGasPrice } = transactionReceipt
                const gasCost = gasUsed.mul(effectiveGasPrice) // both variables are BigNumbers we used .mul to multiply them

                const endingFundMeBalance = await fundMe.provider.getBalance(
                    fundMe.address
                )
                const endingDeployerBalance = await fundMe.provider.getBalance(
                    deployer
                )

                // 3. assert
                assert.equal(endingFundMeBalance, 0) // 0 since we withdrew all the ETH
                assert.equal(startingFundMeBalance.add(startingDeployerBalance.toString()),   // we are using the add function since we're calling startingFundMeBalance from the blockchain and it comes by default as a BigNumber 
                    endingDeployerBalance.add(gasCost).toString()) // adding the gas fee that was generated when we called fundMe.withdraw() by our deployer

                // make sure that the getFunder are reset properly
                await expect(fundMe.getFunder(0)).to.be.reverted

                for (let i = 0; i < 6; i += 1) {
                    assert.equal(
                        await fundMe.getAddressAmountFunded(accounts[i].address), 0
                    )
                }
            })

            it("withdraw ETH from a single founder", async function () {
                // 1. arrange
                const startingFundMeBalance = await fundMe.provider.getBalance(
                    fundMe.address
                )
                const startingDeployerBalance = await fundMe.provider.getBalance(
                    deployer
                )

                // 2.act
                const transactionResponse = await fundMe.cheaperWithdraw()
                const transactionReceipt = await transactionResponse.wait(1)

                // gas cost
                const { gasUsed, effectiveGasPrice } = transactionReceipt
                const gasCost = gasUsed.mul(effectiveGasPrice) // both variables are BigNumbers we used .mul to multiply them

                const endingFundMeBalance = await fundMe.provider.getBalance(
                    fundMe.address
                )
                const endingDeployerBalance = await fundMe.provider.getBalance(
                    deployer
                )

                // 3. assert
                assert.equal(endingFundMeBalance, 0) // 0 since we withdrew all the ETH
                assert.equal(startingFundMeBalance.add(startingDeployerBalance.toString()),   // we are using the add function since we're calling startingFundMeBalance from the blockchain and it comes by default as a BigNumber 
                    endingDeployerBalance.add(gasCost).toString()) // adding the gas fee that was generated when we called fundMe.withdraw() by our deployer
            })

        })
    })