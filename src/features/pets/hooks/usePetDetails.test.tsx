import { renderHook, waitFor, act } from '@testing-library/react';
import { usePetDetails } from './usePetDetails';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { usePetsStore } from '@store/pets.store';
import { useAuthStore } from '@store/auth.store';
import { petVetService } from '@services/petVetService';
import { makePet } from '@testUtils/factories/makePet';
import { useParams, useNavigate } from 'react-router-dom';
import type { PetVetLink, Vet } from '@models/vets';

// Mocks
vi.mock('react-router-dom', () => ({
  useParams: vi.fn(),
  useNavigate: vi.fn(),
}));

vi.mock('@store/pets.store');
vi.mock('@store/auth.store');
vi.mock('@services/petVetService');
vi.mock('@featureFlags/hooks/useFeatureFlag', () => ({
  useFeatureFlag: vi.fn().mockReturnValue(true),
}));
vi.mock('@repositories/storageRepository', () => ({
  storageRepository: {
    deleteFile: vi.fn(),
  },
}));
vi.mock('@i18n', () => ({
  loadNamespace: vi.fn().mockResolvedValue(undefined),
}));

describe('usePetDetails', () => {
  const mockNavigate = vi.fn();
  const mockUpdatePet = vi.fn();
  const mockDeletePet = vi.fn();
  const mockPet = makePet({ id: '123', name: 'Buddy' });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useParams).mockReturnValue({ id: '123' });
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);
    vi.mocked(usePetsStore).mockImplementation((selector) => {
      if (selector.toString().includes('pets')) return [mockPet];
      if (selector.toString().includes('deletePet')) return mockDeletePet;
      if (selector.toString().includes('updatePet')) return mockUpdatePet;
      return undefined;
    });
    vi.mocked(useAuthStore).mockReturnValue({ uid: 'user1' });
  });

  it('returns pet details', () => {
    const { result } = renderHook(() => usePetDetails());
    expect(result.current.pet).toEqual(mockPet);
  });

  it('loads vet links', async () => {
    const mockLinks = [{ link: { id: '1' }, vet: { name: 'Dr. Smith' } }];
    vi.mocked(petVetService.getPetVets).mockResolvedValue(
      mockLinks as unknown as { link: PetVetLink; vet: Vet }[]
    );

    const { result } = renderHook(() => usePetDetails());

    await waitFor(() => {
      expect(result.current.vetLinks).toEqual(mockLinks);
    });
  });

  it('handles photo upload', async () => {
    const { result } = renderHook(() => usePetDetails());
    const url = 'http://example.com/photo.jpg';
    const path = 'pets/123/photo.jpg';

    await act(async () => {
      await result.current.handlePhotoUpload(url, path);
    });

    expect(mockUpdatePet).toHaveBeenCalledWith('123', {
      photos: expect.arrayContaining([expect.objectContaining({ url, path })]),
    });
  });

  it('handles set main photo', async () => {
    const { result } = renderHook(() => usePetDetails());
    const photo = { url: 'http://example.com/photo.jpg' };

    await act(async () => {
      await result.current.handleSetMainPhoto(photo);
    });

    expect(mockUpdatePet).toHaveBeenCalledWith('123', {
      mainPhotoUrl: photo.url,
    });
  });

  it('handles delete photo', async () => {
    const { result } = renderHook(() => usePetDetails());
    const photo = {
      url: 'http://example.com/photo.jpg',
      path: 'path/to/photo',
      createdAt: '2023-01-01',
    };
    mockPet.photos = [photo]; // Ensure pet has the photo

    await act(async () => {
      await result.current.handleDeletePhoto(photo);
    });

    expect(mockUpdatePet).toHaveBeenCalledWith('123', {
      photos: [],
    });
  });

  it('handles delete pet', async () => {
    const { result } = renderHook(() => usePetDetails());

    await act(async () => {
      await result.current.handleDelete();
    });

    expect(mockDeletePet).toHaveBeenCalledWith('123');
    expect(mockNavigate).toHaveBeenCalledWith('/pets');
  });

  it('handles errors during photo operations', async () => {
    mockUpdatePet.mockRejectedValue(new Error('Update failed'));
    const { result } = renderHook(() => usePetDetails());

    await act(async () => {
      await result.current.handlePhotoUpload('url', 'path');
    });

    expect(result.current.error).toBeTruthy();
  });

  it('does not perform operations if pet is not found', async () => {
    vi.mocked(usePetsStore).mockImplementation((selector) => {
      if (selector.toString().includes('pets')) return []; // No pets
      return undefined;
    });

    const { result } = renderHook(() => usePetDetails());

    await act(async () => {
      await result.current.handlePhotoUpload('url', 'path');
      await result.current.handleSetMainPhoto({ url: 'url' });
      await result.current.handleDeletePhoto({ url: 'url', path: 'path' });
      await result.current.handleDelete();
    });

    expect(mockUpdatePet).not.toHaveBeenCalled();
    expect(mockDeletePet).not.toHaveBeenCalled();
  });

  it('does not load vet links if flags disabled', async () => {
    const { useFeatureFlag } = await import(
      '@featureFlags/hooks/useFeatureFlag'
    );
    vi.mocked(useFeatureFlag).mockReturnValue(false);

    renderHook(() => usePetDetails());

    await waitFor(() => {
      expect(petVetService.getPetVets).not.toHaveBeenCalled();
    });
  });
});
