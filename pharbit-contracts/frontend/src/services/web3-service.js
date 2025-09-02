import { ethers } from "ethers";

class Web3Service {
	provider = null;
	signer = null;
	accounts = [];

	async connect() {
		if (!window.ethereum) throw new Error('MetaMask not found');
		this.provider = new ethers.BrowserProvider(window.ethereum);
		this.accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
		this.signer = await this.provider.getSigner();
		return { address: await this.signer.getAddress() };
	}

	getContract(address, abi) {
		if (!this.signer) throw new Error('Not connected');
		return new ethers.Contract(address, abi, this.signer);
	}
}

export default new Web3Service();