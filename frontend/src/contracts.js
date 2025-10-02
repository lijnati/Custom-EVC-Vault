
export const CONTRACTS = {

  VAULT: "0x5DEbB55F4f0a4871F254A24eCDF29941cD84Bc29", // CustomVault address
  TOKEN: "0x8bD2142a816986ccE864853aE419C30a2931F15B", // MockToken address
  EVC: "0xB905d85a4383DFe5682c03dDB32d0580910A1B4B"    // MockEVC address
};

// this are ABIs
export const VAULT_ABI = [
  "function deposit(uint256 amount) external",
  "function withdraw(uint256 amount) external", 
  "function borrow(uint256 amount) external",
  "function repay(uint256 amount) external",
  "function balances(address) external view returns (uint256)",
  "function borrowBalances(address) external view returns (uint256)",
  "function getAccountHealth(address) external view returns (uint256)",
  "function totalDeposits() external view returns (uint256)",
  "function totalBorrows() external view returns (uint256)",
  "function collateralFactor() external view returns (uint256)",
  "function interestRate() external view returns (uint256)",
  "event Deposit(address indexed user, uint256 amount)",
  "event Withdraw(address indexed user, uint256 amount)",
  "event Borrow(address indexed user, uint256 amount)",
  "event Repay(address indexed user, uint256 amount)"
];

export const TOKEN_ABI = [
  "function balanceOf(address) external view returns (uint256)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function mint(address to, uint256 amount) external",
  "function name() external view returns (string)",
  "function symbol() external view returns (string)",
  "function decimals() external view returns (uint8)"
];

export const EVC_ABI = [
  "function enableController(address account, address controller) external",
  "function disableController(address account, address controller) external", 
  "function isControllerEnabled(address account, address controller) external view returns (bool)"
];