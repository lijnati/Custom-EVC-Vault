const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CustomVault", function () {
    let customVault, mockToken, mockEVC, owner, user1, user2;

    beforeEach(async function () {
        [owner, user1, user2] = await ethers.getSigners();

        // deploy MockEVC here
        const MockEVC = await ethers.getContractFactory("MockEVC");
        mockEVC = await MockEVC.deploy();
        await mockEVC.waitForDeployment();

        // deploy MockToken here
        const MockToken = await ethers.getContractFactory("MockToken");
        mockToken = await MockToken.deploy("Test Token", "TEST");
        await mockToken.waitForDeployment();

        // deploy CustomVault here
        const CustomVault = await ethers.getContractFactory("CustomVault");
        customVault = await CustomVault.deploy(await mockEVC.getAddress(), await mockToken.getAddress());
        await customVault.waitForDeployment();

        // Mint tokens to users
        await mockToken.mint(user1.address, ethers.parseEther("1000"));
        await mockToken.mint(user2.address, ethers.parseEther("1000"));
    });

    describe("Deposits", function () {
        it("Should allow users to deposit tokens", async function () {
            const depositAmount = ethers.parseEther("100");

            await mockToken.connect(user1).approve(await customVault.getAddress(), depositAmount);
            await customVault.connect(user1).deposit(depositAmount);

            expect(await customVault.balances(user1.address)).to.equal(depositAmount);
            expect(await customVault.totalDeposits()).to.equal(depositAmount);
        });

        it("Should revert on zero deposit", async function () {
            await expect(
                customVault.connect(user1).deposit(0)
            ).to.be.revertedWith("Amount must be greater than 0");
        });
    });

    describe("Withdrawals", function () {
        beforeEach(async function () {
            const depositAmount = ethers.parseEther("100");
            await mockToken.connect(user1).approve(await customVault.getAddress(), depositAmount);
            await customVault.connect(user1).deposit(depositAmount);
        });

        it("Should allow users to withdraw their deposits", async function () {
            const withdrawAmount = ethers.parseEther("50");

            await customVault.connect(user1).withdraw(withdrawAmount);

            expect(await customVault.balances(user1.address)).to.equal(
                ethers.parseEther("50")
            );
        });

        it("Should revert on insufficient balance", async function () {
            await expect(
                customVault.connect(user1).withdraw(ethers.parseEther("200"))
            ).to.be.revertedWith("Insufficient balance");
        });
    });
});