/**
 * Example usage of the simplified blockchain
 */

const { Blockchain } = require("./blockchain");

// Create blockchain instance
const blockchain = new Blockchain();

// Listen for new blocks
blockchain.on("blockAdded", (block) => {
  console.log("New block added:", block);
});

// Example: Add pharmaceutical batch data
const batchData = {
  batchId: "BATCH-001",
  product: "Medicine-A",
  manufacturer: "Pharma Corp",
  manufactureDate: "2025-09-12",
  expiryDate: "2027-09-12",
  quantity: 1000,
  storageTemp: "2-8°C",
};

// Add batch to blockchain
const batchBlock = blockchain.addData(batchData);
console.log("Batch added to blockchain:", batchBlock);

// Example: Add quality control data
const qcData = {
  batchId: "BATCH-001",
  testDate: "2025-09-12",
  tests: [
    { name: "pH Test", result: "Pass", value: 7.2 },
    { name: "Sterility", result: "Pass" },
    { name: "Potency", result: "Pass", value: "98%" },
  ],
  approvedBy: "QC Lab",
};

// Add QC data to blockchain
const qcBlock = blockchain.addData(qcData);
console.log("QC data added to blockchain:", qcBlock);

// Example: Add shipping data
const shippingData = {
  batchId: "BATCH-001",
  shipmentId: "SHIP-001",
  from: "Manufacturing Plant",
  to: "Distribution Center",
  temperature: {
    min: 2.5,
    max: 7.8,
    average: 5.2,
  },
  timestamp: new Date().toISOString(),
};

// Add shipping data to blockchain
const shippingBlock = blockchain.addData(shippingData);
console.log("Shipping data added to blockchain:", shippingBlock);

// Verify blockchain integrity
const isValid = blockchain.isChainValid();
console.log("Blockchain is valid:", isValid);

// Find all blocks for a specific batch
const batchBlocks = blockchain.findBlocks({ batchId: "BATCH-001" });
console.log("All blocks for BATCH-001:", batchBlocks);

// Export blockchain data
const exportedData = blockchain.export();
console.log("Exported blockchain:", exportedData);

// Example: Create new blockchain and import data
const newBlockchain = new Blockchain();
const imported = newBlockchain.import(exportedData);
console.log("Import successful:", imported);

// Verify imported chain is valid
console.log("Imported chain is valid:", newBlockchain.isChainValid());
