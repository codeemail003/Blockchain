// MetaMask client integration
document.addEventListener("DOMContentLoaded", function () {
  const metamask = new MetaMaskIntegration();
  const successModal = new bootstrap.Modal(
    document.getElementById("successModal")
  );
  const errorModal = new bootstrap.Modal(document.getElementById("errorModal"));

  // Connect wallet button
  document
    .getElementById("connectWallet")
    .addEventListener("click", async () => {
      try {
        await metamask.initialize();
        updateWalletInfo();
      } catch (error) {
        showError(error.message);
      }
    });

  // Transaction form submission
  document
    .getElementById("transactionForm")
    .addEventListener("submit", async (e) => {
      e.preventDefault();

      try {
        const transaction = {
          to: document.getElementById("recipientAddress").value,
          amount: document.getElementById("amount").value,
          data: document.getElementById("transactionData").value,
        };

        const txHash = await metamask.sendTransaction(transaction);
        showSuccess(txHash);
        addTransactionToHistory(transaction, txHash);
      } catch (error) {
        showError(error.message);
      }
    });

  // Update wallet information
  async function updateWalletInfo() {
    const account = metamask.getCurrentAccount();
    if (account) {
      document.getElementById("connectionStatus").textContent = "Connected";
      document.getElementById("connectionStatus").className = "text-success";
      document.getElementById("accountAddress").textContent = account;

      const balance = await metamask.getBalance();
      document.getElementById("accountBalance").textContent = balance;

      const networkNames = {
        1: "Ethereum Mainnet",
        3: "Ropsten Testnet",
        4: "Rinkeby Testnet",
        5: "Goerli Testnet",
        42: "Kovan Testnet",
      };

      document.getElementById("networkInfo").textContent =
        networkNames[metamask.networkId] || `Chain ID: ${metamask.networkId}`;
    }
  }

  // Add transaction to history
  function addTransactionToHistory(transaction, txHash) {
    const history = document.getElementById("transactionHistory");
    const item = document.createElement("div");
    item.className = "list-group-item";

    const shortHash = `${txHash.substring(0, 6)}...${txHash.substring(62)}`;
    const shortAddress = `${transaction.to.substring(
      0,
      6
    )}...${transaction.to.substring(38)}`;

    item.innerHTML = `
            <div class="d-flex w-100 justify-content-between">
                <h6 class="mb-1">To: ${shortAddress}</h6>
                <small>${new Date().toLocaleString()}</small>
            </div>
            <p class="mb-1">Amount: ${transaction.amount} ETH</p>
            <small>Transaction: ${shortHash}</small>
        `;

    history.insertBefore(item, history.firstChild);
  }

  // Show success modal
  function showSuccess(txHash) {
    document.getElementById("txHash").textContent = txHash;
    successModal.show();
  }

  // Show error modal
  function showError(message) {
    document.getElementById("errorMessage").textContent = message;
    errorModal.show();
  }

  // Setup MetaMask event listeners
  if (metamask.web3) {
    metamask.on("accountsChanged", () => {
      updateWalletInfo();
    });

    metamask.on("networkChanged", () => {
      updateWalletInfo();
    });

    metamask.on("connect", () => {
      updateWalletInfo();
    });

    metamask.on("disconnect", () => {
      document.getElementById("connectionStatus").textContent = "Disconnected";
      document.getElementById("connectionStatus").className = "text-danger";
      document.getElementById("accountAddress").textContent = "-";
      document.getElementById("accountBalance").textContent = "-";
      document.getElementById("networkInfo").textContent = "-";
    });
  }
});
