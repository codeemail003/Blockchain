# My Blockchain App

## Overview

My Blockchain App is a full-stack application that integrates a React frontend with an Express backend. The application allows users to manage their wallets, authenticate, and interact with a blockchain network.

## Project Structure

```
my-blockchain-app
├── server                # Backend server code
│   ├── index.js         # Main server file
│   ├── routes            # API routes
│   │   ├── auth.js      # Authentication routes
│   │   ├── wallet.js     # Wallet management routes
│   │   └── transaction.js # Transaction broadcasting routes
│   ├── .env             # Environment variables
│   ├── package.json      # Backend dependencies
│   └── README.md         # Backend documentation
├── src                   # Frontend source code
│   ├── App.tsx          # Main React component
│   ├── api              # API utility functions
│   │   └── backend.ts    # API calls to the backend
│   ├── components       # React components
│   │   ├── AuthForm.tsx  # User authentication forms
│   │   ├── WalletCreator.tsx # Wallet creation component
│   │   ├── WalletDashboard.tsx # Wallet overview component
│   │   └── TransactionHistory.tsx # Transaction history component
│   └── main.tsx        # Entry point for the React application
├── public               # Public assets
│   └── index.html       # Main HTML file
├── package.json         # Frontend dependencies
├── tsconfig.json        # TypeScript configuration
└── README.md            # Overall project documentation
```

## Getting Started

### Prerequisites

- Node.js
- npm or yarn

### Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd my-blockchain-app
   ```

2. Install backend dependencies:
   ```
   cd server
   npm install
   ```

3. Install frontend dependencies:
   ```
   cd ../
   npm install
   ```

### Configuration

1. Create a `.env` file in the `server/` directory and add your Supabase API keys and any other sensitive information.

### Running the Application

1. Start the backend server:
   ```
   cd server
   node index.js
   ```

2. Start the frontend application:
   ```
   cd ../
   npm run dev
   ```

### Usage

- Navigate to the frontend application in your browser to interact with the wallet management features.
- Use the authentication forms to sign up or log in.
- Create wallets, check balances, and view transaction history.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements or features.

## License

This project is licensed under the MIT License.