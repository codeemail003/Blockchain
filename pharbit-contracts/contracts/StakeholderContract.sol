// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title StakeholderContract
 * @notice Manages companies, KYC, and stakeholder roles
 */
contract StakeholderContract is AccessControl {
    bytes32 public constant REGISTRAR_ROLE = keccak256("REGISTRAR_ROLE");

    enum Role {
        NONE,
        MANUFACTURER,
        DISTRIBUTOR,
        PHARMACY,
        REGULATOR
    }

    struct Company {
        string name;
        Role role;
        bool kycCompleted;
        string kycReference; // off-chain reference ID
        address wallet;
        uint256 registeredAt;
        bool active;
    }

    mapping(address => Company) private companies;
    address[] private companyList;

    event CompanyRegistered(address indexed wallet, string name, Role role);
    event CompanyUpdated(address indexed wallet, bool kycCompleted, string kycReference, bool active);

    error AlreadyRegistered();
    error NotRegistered();
    error BadInput();

    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(REGISTRAR_ROLE, admin);
    }

    function registerCompany(address wallet, string calldata name, Role role) external onlyRole(REGISTRAR_ROLE) {
        if (wallet == address(0) || bytes(name).length == 0 || role == Role.NONE) revert BadInput();
        if (companies[wallet].registeredAt != 0) revert AlreadyRegistered();
        companies[wallet] = Company({
            name: name,
            role: role,
            kycCompleted: false,
            kycReference: "",
            wallet: wallet,
            registeredAt: block.timestamp,
            active: true
        });
        companyList.push(wallet);
        emit CompanyRegistered(wallet, name, role);
    }

    function setKYC(address wallet, bool completed, string calldata kycReference) external onlyRole(REGISTRAR_ROLE) {
        Company storage c = companies[wallet];
        if (c.registeredAt == 0) revert NotRegistered();
        c.kycCompleted = completed;
        c.kycReference = kycReference;
        emit CompanyUpdated(wallet, completed, kycReference, c.active);
    }

    function setActive(address wallet, bool active) external onlyRole(REGISTRAR_ROLE) {
        Company storage c = companies[wallet];
        if (c.registeredAt == 0) revert NotRegistered();
        c.active = active;
        emit CompanyUpdated(wallet, c.kycCompleted, c.kycReference, active);
    }

    function getCompany(address wallet) external view returns (Company memory) {
        Company memory c = companies[wallet];
        if (c.registeredAt == 0) revert NotRegistered();
        return c;
    }

    function listCompanies() external view returns (Company[] memory) {
        Company[] memory list = new Company[](companyList.length);
        for (uint256 i = 0; i < companyList.length; i++) {
            list[i] = companies[companyList[i]];
        }
        return list;
    }
}

