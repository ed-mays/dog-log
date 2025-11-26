import React from 'react';
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
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
      {photos.map((photo) => (
        <div key={photo.path} className="relative group">
          <img
            src={photo.url}
            alt="Pet"
            className={`w-full h-48 object-cover rounded-lg ${
              mainPhotoUrl === photo.url ? 'ring-4 ring-blue-500' : ''
            }`}
          />
          <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 rounded-lg">
            <button
              onClick={() => onSetMainPhoto(photo)}
              className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
              disabled={mainPhotoUrl === photo.url}
            >
              {mainPhotoUrl === photo.url ? t('mainPhoto') : t('setAsMain')}
            </button>
            <button
              onClick={() => onDeletePhoto(photo)}
              className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
            >
              {t('delete')}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
