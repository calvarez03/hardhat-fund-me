const { run } = require("hardhat")

async function verify(contractAddres, args) {
    console.log("verifying contract...")
    try {
        await run("verify:verify", {
            address: contractAddres,
            constructorArguments: args,
        })
    } catch (e) {
        if (e.message.toLowerCase().includes("already verified")) {
            console.log("already verified")
        } else {
            console.log(e)
        }
    }
}

module.exports = { verify }