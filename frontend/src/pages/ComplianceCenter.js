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

const ComplianceCenter = () => {
  return (
    <Container>
      <Title>Compliance Center</Title>
      <p>Compliance center functionality coming soon...</p>
    </Container>
  );
};

export default ComplianceCenter;