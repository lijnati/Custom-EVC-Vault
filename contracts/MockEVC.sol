// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MockEVC {
    mapping(address => mapping(address => bool)) public controllers;
    
    event ControllerEnabled(address indexed account, address indexed controller);
    event ControllerDisabled(address indexed account, address indexed controller);

    function enableController(address account, address controller) external {
        controllers[account][controller] = true;
        emit ControllerEnabled(account, controller);
    }

    function disableController(address account, address controller) external {
        controllers[account][controller] = false;
        emit ControllerDisabled(account, controller);
    }

    function isControllerEnabled(address account, address controller) external view returns (bool) {
        return controllers[account][controller];
    }

    function requireAccountStatusCheck(address account) external pure {
        // Mock implementation - in real EVC this would check account health
        require(account != address(0), "Invalid account");
    }

    function requireVaultStatusCheck() external view {
        // Mock implementation - in real EVC this would check vault status
    }
}