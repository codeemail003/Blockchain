// Contract ABIs - You'll need to replace these with your actual contract ABIs after compilation
const PHARBIT_CORE_ABI = [
    "function registerDrug(string drugId, string name, string manufacturer)",
    "function createBatch(string batchId, string drugId, uint256 quantity)",
    "function batches(string) view returns (string batchId, string drugId, uint256 quantity, uint256 manufacturingDate, string status, address manufacturer)",
    "event BatchCreated(string batchId, string drugId, uint256 quantity, address manufacturer)",
    "event DrugRegistered(string drugId, string name, string manufacturer)"
];

// Contract addresses - You'll need to replace these with your deployed contract addresses
const PHARBIT_CORE_ADDRESS = "YOUR_DEPLOYED_CONTRACT_ADDRESS";

let provider;
let signer;
let pharbitCore;

async function connectWallet() {
    try {
        // Check if MetaMask is installed
        if (typeof window.ethereum === "undefined") {
            alert("Please install MetaMask to use this dApp!");
            return;
        }

        // Request account access
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        // Set up ethers provider and signer
        provider = new ethers.providers.Web3Provider(window.ethereum);
        signer = provider.getSigner();
        
        // Initialize contract
        pharbitCore = new ethers.Contract(PHARBIT_CORE_ADDRESS, PHARBIT_CORE_ABI, signer);

        // Update UI
        document.getElementById('walletAddress').textContent = `Connected: ${accounts[0].substring(0, 6)}...${accounts[0].substring(38)}`;
        document.getElementById('walletAddress').classList.remove('hidden');
        document.getElementById('connectWallet').classList.add('hidden');
        document.getElementById('not-connected').classList.add('hidden');
        document.getElementById('main-content').classList.remove('hidden');

        // Listen for account changes
        window.ethereum.on('accountsChanged', handleAccountsChanged);
    } catch (error) {
        console.error("Error connecting to MetaMask:", error);
        alert("Failed to connect to MetaMask!");
    }
}

function handleAccountsChanged(accounts) {
    if (accounts.length === 0) {
        // MetaMask is locked or the user has not connected any accounts
        document.getElementById('not-connected').classList.remove('hidden');
        document.getElementById('main-content').classList.add('hidden');
    } else {
        // Update the UI with the new account
        document.getElementById('walletAddress').textContent = `Connected: ${accounts[0].substring(0, 6)}...${accounts[0].substring(38)}`;
    }
}

async function registerDrug(event) {
    event.preventDefault();
    
    const drugId = document.getElementById('drugId').value;
    const drugName = document.getElementById('drugName').value;
    const manufacturer = document.getElementById('manufacturer').value;

    try {
        const tx = await pharbitCore.registerDrug(drugId, drugName, manufacturer);
        await tx.wait();
        alert('Drug registered successfully!');
        event.target.reset();
    } catch (error) {
        console.error("Error registering drug:", error);
        alert('Failed to register drug. Check console for details.');
    }
}

async function createBatch(event) {
    event.preventDefault();
    
    const batchId = document.getElementById('batchId').value;
    const drugId = document.getElementById('batchDrugId').value;
    const quantity = document.getElementById('quantity').value;

    try {
        const tx = await pharbitCore.createBatch(batchId, drugId, quantity);
        await tx.wait();
        alert('Batch created successfully!');
        event.target.reset();
        await updateBatchList();
    } catch (error) {
        console.error("Error creating batch:", error);
        alert('Failed to create batch. Check console for details.');
    }
}

async function updateBatchList() {
    // This is a placeholder - you'll need to implement a way to fetch recent batches
    // One way would be to listen for BatchCreated events
    const batchList = document.getElementById('batchList');
    // Clear existing list
    batchList.innerHTML = '';
    
    // Example of listening to events (you'll need to implement this)
    pharbitCore.on("BatchCreated", (batchId, drugId, quantity, manufacturer) => {
        const batchItem = document.createElement('div');
        batchItem.className = 'list-group-item';
        batchItem.innerHTML = `
            <h6>Batch ID: ${batchId}</h6>
            <p>Drug ID: ${drugId}</p>
            <p>Quantity: ${quantity}</p>
            <p>Manufacturer: ${manufacturer}</p>
        `;
        batchList.appendChild(batchItem);
    });
}

// Set up event listeners
document.getElementById('connectWallet').addEventListener('click', connectWallet);
document.getElementById('drugForm').addEventListener('submit', registerDrug);
document.getElementById('batchForm').addEventListener('submit', createBatch);

// Check if MetaMask is already connected
if (typeof window.ethereum !== "undefined") {
    window.ethereum.request({ method: 'eth_accounts' })
        .then(accounts => {
            if (accounts.length > 0) {
                connectWallet();
            }
        });
}