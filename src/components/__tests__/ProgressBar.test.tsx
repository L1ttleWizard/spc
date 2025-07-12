import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import ProgressBar from '../ProgressBar';

describe('ProgressBar', () => {
  it('renders with correct value', () => {
    const { getByRole } = render(
      <ProgressBar value={50} onChange={() => {}} />
    );
    const slider = getByRole('slider');
    expect(slider).toHaveValue('50');
  });

  it('calls onChange when value changes', () => {
    const handleChange = jest.fn();
    const { getByRole } = render(
      <ProgressBar value={30} onChange={handleChange} />
    );
    const slider = getByRole('slider');
    fireEvent.change(slider, { target: { value: '60' } });
    expect(handleChange).toHaveBeenCalled();
  });

  it('is disabled when disabled prop is true', () => {
    const { getByRole } = render(
      <ProgressBar value={10} onChange={() => {}} disabled />
    );
    const slider = getByRole('slider');
    expect(slider).toBeDisabled();
  });
});