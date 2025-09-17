import React from 'react';
import styled from 'styled-components';

const Container = styled.div`
  padding: 2rem;
  text-align: center;
`;

const Title = styled.h1`
  font-size: 2rem;
  margin-bottom: 1rem;
`;

const BatchManagement = () => {
  return (
    <Container>
      <Title>Batch Management</Title>
      <p>Batch management functionality coming soon...</p>
    </Container>
  );
};

export default BatchManagement;