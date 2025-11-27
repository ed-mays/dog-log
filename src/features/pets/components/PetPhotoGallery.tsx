import React from 'react';
import { Button } from '@mui/material';
import styles from './PetPhotoGallery.module.css';
import { useTranslation } from 'react-i18next';
import type { PetPhoto } from '../types';
import { useFeatureFlag } from '../../../featureFlags/hooks/useFeatureFlag';

interface PetPhotoGalleryProps {
  photos: PetPhoto[];
  mainPhotoUrl?: string;
  onSetMainPhoto: (photo: PetPhoto) => void;
  onDeletePhoto: (photo: PetPhoto) => void;
}

export const PetPhotoGallery: React.FC<PetPhotoGalleryProps> = ({
  photos,
  mainPhotoUrl,
  onSetMainPhoto,
  onDeletePhoto,
}) => {
  const { t } = useTranslation('petDetails');
  const isEnabled = useFeatureFlag('petPhotosEnabled');

  if (!isEnabled) return null;

  if (!photos || photos.length === 0) {
    return <div className="text-gray-500">{t('noPhotos')}</div>;
  }

  return (
    <div className={styles.galleryGrid}>
      {photos.map((photo) => (
        <div key={photo.path} className={styles.photoItem}>
          <img
            src={photo.url}
            alt="Pet"
            className={`${styles.photoImage} ${
              mainPhotoUrl === photo.url ? styles.mainPhotoRing : ''
            }`}
          />
          <div className={styles.overlay}>
            <Button
              variant="contained"
              size="small"
              color="primary"
              onClick={() => onSetMainPhoto(photo)}
              disabled={mainPhotoUrl === photo.url}
            >
              {mainPhotoUrl === photo.url ? t('mainPhoto') : t('setAsMain')}
            </Button>
            <Button
              variant="contained"
              size="small"
              color="error"
              onClick={() => onDeletePhoto(photo)}
            >
              {t('delete')}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};
