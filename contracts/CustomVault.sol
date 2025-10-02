// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IEVC {
    function enableController(address account, address controller) external;
    function disableController(address account, address controller) external;
    function isControllerEnabled(address account, address controller) external view returns (bool);
    function requireAccountStatusCheck(address account) external;
    function requireVaultStatusCheck() external;
}

contract CustomVault is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    IEVC public immutable evc;
    IERC20 public immutable asset;
    
    mapping(address => uint256) public balances;
    mapping(address => uint256) public borrowBalances;
    
    uint256 public totalDeposits;
    uint256 public totalBorrows;
    uint256 public interestRate = 500; // 5% APR in basis points
    uint256 public collateralFactor = 8000; // 80% in basis points
    
    event Deposit(address indexed user, uint256 amount);
    event Withdraw(address indexed user, uint256 amount);
    event Borrow(address indexed user, uint256 amount);
    event Repay(address indexed user, uint256 amount);

    constructor(address _evc, address _asset) Ownable(msg.sender) {
        evc = IEVC(_evc);
        asset = IERC20(_asset);
    }

    function deposit(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        
        asset.safeTransferFrom(msg.sender, address(this), amount);
        balances[msg.sender] += amount;
        totalDeposits += amount;
        
        emit Deposit(msg.sender, amount);
    }

    function withdraw(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        require(balances[msg.sender] >= amount, "Insufficient balance");
        
        balances[msg.sender] -= amount;
        totalDeposits -= amount;
        
        // Check if withdrawal maintains healthy collateral ratio
        if (borrowBalances[msg.sender] > 0) {
            require(_isHealthy(msg.sender), "Withdrawal would make position unhealthy");
        }
        
        asset.safeTransfer(msg.sender, amount);
        evc.requireAccountStatusCheck(msg.sender);
        
        emit Withdraw(msg.sender, amount);
    }

    function borrow(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        require(asset.balanceOf(address(this)) >= amount, "Insufficient liquidity");
        
        borrowBalances[msg.sender] += amount;
        totalBorrows += amount;
        
        require(_isHealthy(msg.sender), "Borrow would make position unhealthy");
        
        asset.safeTransfer(msg.sender, amount);
        evc.requireAccountStatusCheck(msg.sender);
        
        emit Borrow(msg.sender, amount);
    }

    function repay(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        require(borrowBalances[msg.sender] >= amount, "Repay amount exceeds debt");
        
        asset.safeTransferFrom(msg.sender, address(this), amount);
        borrowBalances[msg.sender] -= amount;
        totalBorrows -= amount;
        
        evc.requireAccountStatusCheck(msg.sender);
        
        emit Repay(msg.sender, amount);
    }

    function liquidate(address borrower, uint256 repayAmount) external nonReentrant {
        require(!_isHealthy(borrower), "Position is healthy");
        require(repayAmount <= borrowBalances[borrower], "Repay amount too high");
        
        uint256 collateralSeized = (repayAmount * 110) / 100; // 10% liquidation bonus
        require(balances[borrower] >= collateralSeized, "Insufficient collateral");
        
        asset.safeTransferFrom(msg.sender, address(this), repayAmount);
        
        borrowBalances[borrower] -= repayAmount;
        totalBorrows -= repayAmount;
        
        balances[borrower] -= collateralSeized;
        balances[msg.sender] += collateralSeized;
        
        evc.requireAccountStatusCheck(borrower);
    }

    function _isHealthy(address account) internal view returns (bool) {
        if (borrowBalances[account] == 0) return true;
        
        uint256 collateralValue = (balances[account] * collateralFactor) / 10000;
        return collateralValue >= borrowBalances[account];
    }

    function getAccountHealth(address account) external view returns (uint256) {
        if (borrowBalances[account] == 0) return type(uint256).max;
        
        uint256 collateralValue = (balances[account] * collateralFactor) / 10000;
        return (collateralValue * 10000) / borrowBalances[account];
    }

    function setInterestRate(uint256 _interestRate) external onlyOwner {
        require(_interestRate <= 10000, "Interest rate too high");
        interestRate = _interestRate;
    }

    function setCollateralFactor(uint256 _collateralFactor) external onlyOwner {
        require(_collateralFactor <= 10000, "Collateral factor too high");
        collateralFactor = _collateralFactor;
    }
}