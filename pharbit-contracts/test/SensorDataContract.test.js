const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SensorDataContract", function () {
  let sensor, admin, writer;
  beforeEach(async () => {
    [admin, writer] = await ethers.getSigners();
    const Sensor = await ethers.getContractFactory("SensorDataContract");
    sensor = await Sensor.deploy(-20000, 40000, 900, admin.address);
    await sensor.waitForDeployment();
    const DATA_WRITER_ROLE = await sensor.DATA_WRITER_ROLE();
    await sensor.connect(admin).grantRole(DATA_WRITER_ROLE, writer.address);
  });

  it("records telemetry and validates", async () => {
    await expect(sensor.connect(writer).recordTelemetry(1, 1000, 500, "loc", 0))
      .to.emit(sensor, "TelemetryRecorded");
    const latest = await sensor.getLatest(1);
    expect(latest.valid).to.equal(true);
  });
});
