import React from 'react';
import { render, screen } from '@testing-library/react';
import LoadingSpinner from '../LoadingSpinner';

describe('LoadingSpinner', () => {
  it('renders loading spinner', () => {
    render(<LoadingSpinner />);
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('renders with custom message', () => {
    const message = 'Loading data...';
    render(<LoadingSpinner message={message} />);
    expect(screen.getByText(message)).toBeInTheDocument();
  });

  it('renders with custom size', () => {
    const size = 50;
    render(<LoadingSpinner size={size} />);
    const spinner = screen.getByTestId('loading-spinner');
    expect(spinner).toHaveStyle({ width: `${size}px`, height: `${size}px` });
  });
});