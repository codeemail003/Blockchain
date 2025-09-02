import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const PharbitModule = buildModule("PharbitModule", (m) => {
	const admin = m.getParameter("admin", "0x0000000000000000000000000000000000000001");

	const stakeholder = m.contract("PharbitStakeholder", [admin]);
	const sensor = m.contract("PharbitSensor", [admin]);
	const governance = m.contract("PharbitGovernance", [admin, 20, 80, 3600]);
	const batch = m.contract("PharbitBatch", [stakeholder, admin]);
	const supplyChain = m.contract("PharbitSupplyChain", [batch, stakeholder]);

	return { stakeholder, sensor, governance, batch, supplyChain };
});

export default PharbitModule;