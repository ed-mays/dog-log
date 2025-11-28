import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { usePetsStore } from '@store/pets.store';
import { useAuthStore } from '@store/auth.store';
import { useFeatureFlag } from '@featureFlags/hooks/useFeatureFlag';
import { petVetService } from '@services/petVetService';
import { logger } from '@services/logService';
import type { PetVetLink, Vet } from '@models/vets';
import type { PetUpdateInput } from '../types';
import { loadNamespace } from '@i18n';

export function usePetDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation('common');

  const pets = usePetsStore((s) => s.pets);
  const deletePet = usePetsStore((s) => s.deletePet);
  const updatePet = usePetsStore((s) => s.updatePet);
  const user = useAuthStore((s) => s.user);

  const pet = useMemo(() => pets.find((p) => p.id === id), [pets, id]);

  const [nsReady, setNsReady] = useState(false);
  const [loadingVets, setLoadingVets] = useState(false);
  const [vetLinks, setVetLinks] = useState<
    Array<{ link: PetVetLink; vet: Vet }>
  >([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    Promise.all([loadNamespace('petProperties'), loadNamespace('common')]).then(
      () => {
        if (mounted) setNsReady(true);
      }
    );
    return () => {
      mounted = false;
    };
  }, []);

  // Feature flags
  let vetsEnabled = false;
  let vetLinkingEnabled = false;
  let petActionsEnabled = false;
  let petPhotosEnabled = false;
  try {
    vetsEnabled = useFeatureFlag('vetsEnabled');
    vetLinkingEnabled = useFeatureFlag('vetLinkingEnabled');
    petActionsEnabled = useFeatureFlag('petActionsEnabled');
    petPhotosEnabled = useFeatureFlag('petPhotosEnabled');
  } catch {
    logger.info('Feature flags not available');
  }

  useEffect(() => {
    let mounted = true;

    async function loadVetLinks() {
      if (!user?.uid || !id || !(vetsEnabled && vetLinkingEnabled)) return;

      setLoadingVets(true);
      try {
        const links = await petVetService.getPetVets(user.uid, id);
        if (mounted) setVetLinks(links);
      } catch (err) {
        logger.debug('Failed to load vet links for PetDetailsPage', {
          error: err,
        });
      } finally {
        if (mounted) setLoadingVets(false);
      }
    }

    loadVetLinks();
    return () => {
      mounted = false;
    };
  }, [user?.uid, id, vetsEnabled, vetLinkingEnabled]);

  const handlePhotoUpload = async (url: string, path: string) => {
    if (!pet) return;
    try {
      const newPhoto = {
        path,
        url,
        createdAt: new Date().toISOString(),
      };
      const updatedPhotos = [...(pet.photos || []), newPhoto];
      await updatePet(pet.id, { photos: updatedPhotos });
    } catch (err) {
      logger.error('Failed to update pet with new photo', { error: err });
      setError(t('errors.updateFailed', { defaultValue: 'Update failed' }));
    }
  };

  const handleSetMainPhoto = async (photo: { url: string }) => {
    if (!pet) return;
    try {
      await updatePet(pet.id, { mainPhotoUrl: photo.url });
    } catch (err) {
      logger.error('Failed to set main photo', { error: err });
      setError(t('errors.updateFailed', { defaultValue: 'Update failed' }));
    }
  };

  const handleDeletePhoto = async (photo: { path: string; url: string }) => {
    if (!pet) return;
    try {
      // 1. Delete from storage
      const { storageRepository } = await import(
        '@repositories/storageRepository'
      );
      await storageRepository.deleteFile(photo.path);

      // 2. Update pet record
      const updatedPhotos = (pet.photos || []).filter(
        (p) => p.path !== photo.path
      );
      const updates: PetUpdateInput = { photos: updatedPhotos };
      if (pet.mainPhotoUrl === photo.url) {
        updates.mainPhotoUrl = ''; // Clear main photo if deleted
      }

      await updatePet(pet.id, updates);
    } catch (err) {
      logger.error('Failed to delete photo', { error: err });
      setError(t('errors.deleteFailed', { defaultValue: 'Delete failed' }));
    }
  };

  const handleDelete = async () => {
    if (!pet) return;
    setSaving(true);
    setError(null);
    try {
      await deletePet(pet.id);
      navigate('/pets');
    } catch {
      setError(t('errors.deleteFailed'));
    } finally {
      setSaving(false);
    }
  };

  return {
    pet,
    vetLinks,
    loadingVets,
    saving,
    error,
    vetsEnabled,
    vetLinkingEnabled,
    petActionsEnabled,
    petPhotosEnabled,
    handleDelete,
    handlePhotoUpload,
    handleSetMainPhoto,
    handleDeletePhoto,
    navigate,
    nsReady,
  };
}
