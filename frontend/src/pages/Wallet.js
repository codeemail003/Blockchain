import React from 'react';
import styled from 'styled-components';
import WalletGenerator from '../components/WalletGenerator';

const WalletContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.xl};
`;

const Wallet = () => {
  return (
    <WalletContainer>
      <WalletGenerator />
    </WalletContainer>
  );
};

export default Wallet;