# Sample Hardhat Project

This project demonstrates a basic Hardhat use case. It comes with a sample contract, a test for that contract, and a script that deploys that contract.

Try running some of the following tasks:

```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat run scripts/deploy.js
```

## Integrating with MetaMask

1. Start the local Hardhat node:
```bash
npx hardhat node
```

2. Deploy contracts to local network:
```bash
npx hardhat run scripts/deploy.js --network localhost
```

3. Add the Hardhat network to MetaMask:
- Network Name: Hardhat Local
- New RPC URL: http://127.0.0.1:8545
- Chain ID: 31337
- Currency Symbol: ETH

4. Import a test account:
- Get the private key from the Hardhat node output
- In MetaMask: "Import Account" -> paste the private key

Now you can interact with the contracts through MetaMask!