import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Sidebar from '../Sidebar';
import '@testing-library/jest-dom';

describe('Sidebar', () => {
  const links = [
    { name: 'Home', path: '/' },
    { name: 'Library', path: '/library' },
  ];

  it('renders navigation links', () => {
    render(<Sidebar links={links} activePath="/" onNavigate={jest.fn()} />);
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Library')).toBeInTheDocument();
  });

  it('highlights the active route', () => {
    render(<Sidebar links={links} activePath="/library" onNavigate={jest.fn()} />);
    const active = screen.getByText('Library');
    expect(active).toHaveClass('active');
  });

  it('calls onNavigate when a link is clicked', () => {
    const onNavigate = jest.fn();
    render(<Sidebar links={links} activePath="/" onNavigate={onNavigate} />);
    fireEvent.click(screen.getByText('Library'));
    expect(onNavigate).toHaveBeenCalledWith('/library');
  });
});