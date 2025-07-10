import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Header from '../Header';
import '@testing-library/jest-dom';

describe('Header', () => {
  it('renders login button if not logged in', () => {
    render(<Header user={null} onLogin={jest.fn()} onLogout={jest.fn()} />);
    expect(screen.getByText(/login/i)).toBeInTheDocument();
  });

  it('renders user info and logout button if logged in', () => {
    render(<Header user={{ name: 'Alice' }} onLogin={jest.fn()} onLogout={jest.fn()} />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText(/logout/i)).toBeInTheDocument();
  });

  it('calls onLogin and onLogout', () => {
    const onLogin = jest.fn();
    const onLogout = jest.fn();
    render(<Header user={null} onLogin={onLogin} onLogout={onLogout} />);
    fireEvent.click(screen.getByText(/login/i));
    expect(onLogin).toHaveBeenCalled();
    render(<Header user={{ name: 'Bob' }} onLogin={onLogin} onLogout={onLogout} />);
    fireEvent.click(screen.getByText(/logout/i));
    expect(onLogout).toHaveBeenCalled();
  });
});