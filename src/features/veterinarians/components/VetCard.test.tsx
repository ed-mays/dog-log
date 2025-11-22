import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { VetCard } from './VetCard';
import { makeVet } from '@testUtils/factories/makeVet';

describe('VetCard', () => {
  it('renders vet name', () => {
    const vet = makeVet({ name: 'Dr. Smith' });
    render(<VetCard vet={vet} onClick={vi.fn()} />);
    expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
  });

  it('renders clinic name if present', () => {
    const vet = makeVet({ clinicName: 'Happy Paws' });
    render(<VetCard vet={vet} onClick={vi.fn()} />);
    expect(screen.getByText('Happy Paws')).toBeInTheDocument();
  });

  it('renders phone if present', () => {
    const vet = makeVet({ phone: '555-1234' });
    render(<VetCard vet={vet} onClick={vi.fn()} />);
    expect(screen.getByText('555-1234')).toBeInTheDocument();
  });

  it('renders specialties as chips', () => {
    const vet = makeVet({ specialties: ['Surgery', 'Dentistry'] });
    render(<VetCard vet={vet} onClick={vi.fn()} />);
    expect(screen.getByText('Surgery')).toBeInTheDocument();
    expect(screen.getByText('Dentistry')).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const onClick = vi.fn();
    const vet = makeVet();
    const user = userEvent.setup();

    render(<VetCard vet={vet} onClick={onClick} />);

    await user.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalled();
  });
});
