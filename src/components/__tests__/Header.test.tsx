import React from 'react';
import { render, screen } from '@testing-library/react';
import Header from '../Header';
import '@testing-library/jest-dom';

describe('Header', () => {
  it('renders home link', () => {
    render(<Header />);
    expect(screen.getByRole('link')).toHaveAttribute('href', '/');
  });

  it('renders search input', () => {
    render(<Header />);
    expect(screen.getByPlaceholderText(/что хотите послушать/i)).toBeInTheDocument();
  });
});