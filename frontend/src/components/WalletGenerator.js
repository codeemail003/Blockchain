import React, { useState } from 'react';
import styled from 'styled-components';
import { ethers } from 'ethers';
import { FiCopy, FiDownload, FiEye, FiEyeOff, FiRefreshCw } from 'react-icons/fi';
import toast from 'react-hot-toast';

const WalletGeneratorContainer = styled.div`
  background-color: ${props => props.theme.colors.surface};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing.xl};
  box-shadow: ${props => props.theme.shadows.sm};
`;

const Title = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: ${props => props.theme.colors.text};
  margin: 0 0 ${props => props.theme.spacing.lg} 0;
`;

const Description = styled.p`
  font-size: 1rem;
  color: ${props => props.theme.colors.textSecondary};
  margin: 0 0 ${props => props.theme.spacing.xl} 0;
`;

const WalletGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: ${props => props.theme.spacing.lg};
  margin-bottom: ${props => props.theme.spacing.xl};
`;

const WalletCard = styled.div`
  background-color: ${props => props.theme.colors.background};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.lg};
`;

const WalletHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${props => props.theme.spacing.md};
`;

const WalletTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: ${props => props.theme.colors.text};
  margin: 0;
`;

const WalletActions = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.sm};
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid ${props => props.theme.colors.border};
  background-color: ${props => props.theme.colors.surface};
  color: ${props => props.theme.colors.text};
  border-radius: ${props => props.theme.borderRadius.sm};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: ${props => props.theme.colors.primary}20;
    border-color: ${props => props.theme.colors.primary};
    color: ${props => props.theme.colors.primary};
  }
`;

const WalletField = styled.div`
  margin-bottom: ${props => props.theme.spacing.md};
`;

const FieldLabel = styled.label`
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: ${props => props.theme.colors.textSecondary};
  margin-bottom: ${props => props.theme.spacing.xs};
`;

const FieldValue = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  padding: ${props => props.theme.spacing.sm};
  background-color: ${props => props.theme.colors.surface};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.sm};
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.875rem;
  color: ${props => props.theme.colors.text};
  word-break: break-all;
`;

const CopyButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  background-color: transparent;
  color: ${props => props.theme.colors.textSecondary};
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;

  &:hover {
    color: ${props => props.theme.colors.primary};
  }
`;

const GenerateButton = styled.button`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.xl};
  background-color: ${props => props.theme.colors.primary};
  color: white;
  border: none;
  border-radius: ${props => props.theme.borderRadius.md};
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  margin: 0 auto;

  &:hover {
    background-color: ${props => props.theme.colors.primary}dd;
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const WarningBox = styled.div`
  background-color: #fef3c7;
  border: 1px solid #f59e0b;
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.md};
  margin-top: ${props => props.theme.spacing.lg};
`;

const WarningTitle = styled.h4`
  font-size: 0.875rem;
  font-weight: 600;
  color: #92400e;
  margin: 0 0 ${props => props.theme.spacing.xs} 0;
`;

const WarningText = styled.p`
  font-size: 0.875rem;
  color: #92400e;
  margin: 0;
  line-height: 1.5;
`;

const WalletGenerator = () => {
  const [wallets, setWallets] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPrivateKeys, setShowPrivateKeys] = useState({});

  const generateWallets = async () => {
    try {
      setIsGenerating(true);
      
      // Generate 2 new wallets
      const newWallets = [];
      for (let i = 0; i < 2; i++) {
        const wallet = ethers.Wallet.createRandom();
        newWallets.push({
          id: `wallet-${Date.now()}-${i}`,
          address: wallet.address,
          privateKey: wallet.privateKey,
          mnemonic: wallet.mnemonic?.phrase || 'N/A',
          index: wallets.length + i + 1
        });
      }
      
      setWallets(prev => [...prev, ...newWallets]);
      toast.success('2 new wallets generated successfully!');
    } catch (error) {
      console.error('Wallet generation error:', error);
      toast.error('Failed to generate wallets');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard`);
    } catch (error) {
      console.error('Copy error:', error);
      toast.error('Failed to copy to clipboard');
    }
  };

  const downloadWallet = (wallet) => {
    const walletData = {
      address: wallet.address,
      privateKey: wallet.privateKey,
      mnemonic: wallet.mnemonic,
      index: wallet.index
    };
    
    const dataStr = JSON.stringify(walletData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `wallet-${wallet.index}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success('Wallet data downloaded');
  };

  const togglePrivateKey = (walletId) => {
    setShowPrivateKeys(prev => ({
      ...prev,
      [walletId]: !prev[walletId]
    }));
  };

  return (
    <WalletGeneratorContainer>
      <Title>Wallet Generator</Title>
      <Description>
        Generate new Ethereum wallets for testing and development. Each wallet includes a unique address, private key, and mnemonic phrase.
      </Description>

      <GenerateButton onClick={generateWallets} disabled={isGenerating}>
        <FiRefreshCw size={16} />
        {isGenerating ? 'Generating...' : 'Generate 2 New Wallets'}
      </GenerateButton>

      {wallets.length > 0 && (
        <WalletGrid>
          {wallets.map((wallet) => (
            <WalletCard key={wallet.id}>
              <WalletHeader>
                <WalletTitle>Wallet {wallet.index}</WalletTitle>
                <WalletActions>
                  <ActionButton
                    onClick={() => togglePrivateKey(wallet.id)}
                    title={showPrivateKeys[wallet.id] ? 'Hide Private Key' : 'Show Private Key'}
                  >
                    {showPrivateKeys[wallet.id] ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                  </ActionButton>
                  <ActionButton
                    onClick={() => downloadWallet(wallet)}
                    title="Download Wallet Data"
                  >
                    <FiDownload size={16} />
                  </ActionButton>
                </WalletActions>
              </WalletHeader>

              <WalletField>
                <FieldLabel>Address</FieldLabel>
                <FieldValue>
                  <span>{wallet.address}</span>
                  <CopyButton
                    onClick={() => copyToClipboard(wallet.address, 'Address')}
                    title="Copy Address"
                  >
                    <FiCopy size={14} />
                  </CopyButton>
                </FieldValue>
              </WalletField>

              <WalletField>
                <FieldLabel>Private Key</FieldLabel>
                <FieldValue>
                  <span>
                    {showPrivateKeys[wallet.id] ? wallet.privateKey : '••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••'}
                  </span>
                  <CopyButton
                    onClick={() => copyToClipboard(wallet.privateKey, 'Private Key')}
                    title="Copy Private Key"
                  >
                    <FiCopy size={14} />
                  </CopyButton>
                </FieldValue>
              </WalletField>

              <WalletField>
                <FieldLabel>Mnemonic Phrase</FieldLabel>
                <FieldValue>
                  <span>{wallet.mnemonic}</span>
                  <CopyButton
                    onClick={() => copyToClipboard(wallet.mnemonic, 'Mnemonic Phrase')}
                    title="Copy Mnemonic Phrase"
                  >
                    <FiCopy size={14} />
                  </CopyButton>
                </FieldValue>
              </WalletField>
            </WalletCard>
          ))}
        </WalletGrid>
      )}

      <WarningBox>
        <WarningTitle>⚠️ Security Warning</WarningTitle>
        <WarningText>
          <strong>Never share your private keys or mnemonic phrases!</strong> These wallets are for testing purposes only. 
          Do not use them for storing real funds. Always keep your private keys secure and never share them with anyone.
        </WarningText>
      </WarningBox>
    </WalletGeneratorContainer>
  );
};

export default WalletGenerator;