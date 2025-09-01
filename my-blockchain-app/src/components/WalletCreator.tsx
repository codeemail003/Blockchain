import React, { useState } from 'react';
import { createWallet } from '../api/backend';

const WalletCreator: React.FC = () => {
    const [walletName, setWalletName] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleCreateWallet = async () => {
        setError('');
        setSuccess('');

        try {
            const response = await createWallet({ name: walletName });
            if (response.ok) {
                setSuccess('Wallet created successfully!');
                setWalletName('');
            } else {
                const errorData = await response.json();
                setError(errorData.message || 'Failed to create wallet.');
            }
        } catch (err) {
            setError('An error occurred while creating the wallet.');
        }
    };

    return (
        <div>
            <h2>Create a New Wallet</h2>
            <input
                type="text"
                value={walletName}
                onChange={(e) => setWalletName(e.target.value)}
                placeholder="Wallet Name"
            />
            <button onClick={handleCreateWallet}>Create Wallet</button>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {success && <p style={{ color: 'green' }}>{success}</p>}
        </div>
    );
};

export default WalletCreator;