# Backend Server README

## Overview

This backend server is built using Express and serves as the API for the blockchain application. It handles user authentication, wallet management, and transaction broadcasting.

## Project Structure

- **index.js**: Main entry point for the Express server. Initializes middleware and connects to Supabase.
- **routes/**: Contains route definitions for authentication, wallet management, and transactions.
  - **auth.js**: Handles user registration and login.
  - **wallet.js**: Manages wallet creation, balance retrieval, and transaction history.
  - **transaction.js**: Handles transaction broadcasting to the blockchain.
- **.env**: Contains environment variables for sensitive information.
- **package.json**: Lists backend dependencies.

## Setup Instructions

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd my-blockchain-app/server
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   Create a `.env` file in the `server/` directory and add your Supabase API keys and any other necessary configuration.

4. **Run the server**:
   ```bash
   node index.js
   ```

## API Endpoints

- **Authentication**
  - `POST /api/auth/signup`: Register a new user.
  - `POST /api/auth/login`: Log in an existing user.

- **Wallet Management**
  - `POST /api/wallet/create`: Create a new wallet.
  - `GET /api/wallet/balance/:address`: Retrieve the balance of a wallet.
  - `GET /api/wallet/history/:address`: Get transaction history for a wallet.
  - `PUT /api/wallet/mining`: Designate a wallet as a mining wallet.

- **Transaction Broadcasting**
  - `POST /api/transaction/send`: Send a transaction to the blockchain.

## Security Considerations

Ensure that sensitive information is stored in the `.env` file and not committed to version control. Handle private keys with caution and provide warnings to users about the risks of storing them in the browser.

## License

This project is licensed under the MIT License.