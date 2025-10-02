const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();

    console.log("Deploying contracts with account:", await deployer.getAddress());
    console.log("Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)));

    // deploy Mock EVC here
    const MockEVC = await ethers.getContractFactory("MockEVC");
    const mockEVC = await MockEVC.deploy();
    await mockEVC.waitForDeployment();
    console.log("MockEVC deployed to:", await mockEVC.getAddress());

    // Deploy Mock Token
    const MockToken = await ethers.getContractFactory("MockToken");
    const mockToken = await MockToken.deploy("Test Token", "TEST");
    await mockToken.waitForDeployment();
    console.log("MockToken deployed to:", await mockToken.getAddress());

    // Deploy Custom Vault
    const CustomVault = await ethers.getContractFactory("CustomVault");
    const customVault = await CustomVault.deploy(await mockEVC.getAddress(), await mockToken.getAddress());
    await customVault.waitForDeployment();
    console.log("CustomVault deployed to:", await customVault.getAddress());

    // Mint some tokens to deployer for testing
    await mockToken.mint(await deployer.getAddress(), ethers.parseEther("10000"));
    console.log("Minted 10000 TEST tokens to deployer");

    console.log("\nDeployment Summary:");
    console.log("==================");
    console.log("MockEVC:", await mockEVC.getAddress());
    console.log("MockToken:", await mockToken.getAddress());
    console.log("CustomVault:", await customVault.getAddress());
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });