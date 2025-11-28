import React, { useRef, useState } from 'react';
import styles from './PhotoUpload.module.css';
import { useTranslation } from 'react-i18next';
import { storageConfig } from '../../config/storage';
import { storageRepository } from '../../repositories/storageRepository';
import { logger } from '../../services/logService';

interface PhotoUploadProps {
  storagePath: string;
  onUploadComplete: (url: string, path: string) => void;
  onError?: (error: Error) => void;
}

export const PhotoUpload: React.FC<PhotoUploadProps> = ({
  storagePath,
  onUploadComplete,
  onError,
}) => {
  const { t } = useTranslation('common');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const processFiles = async (files: FileList) => {
    if (files.length === 0) return;

    setUploading(true);
    setProgress(0);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        console.log('[PhotoUpload] Uploading file:', {
          name: file.name,
          size: file.size,
          type: file.type,
          storagePath,
        });

        // Validate size
        if (file.size > storageConfig.MAX_PHOTO_SIZE_MB * 1024 * 1024) {
          throw new Error(
            t('validation.fileSizeTooLarge', {
              maxSize: storageConfig.MAX_PHOTO_SIZE_MB,
            })
          );
        }

        // Validate type
        if (!file.type.startsWith('image/')) {
          throw new Error(t('validation.invalidFileType'));
        }

        const fileName = `${Date.now()}_${file.name}`;
        const fullPath = `${storagePath}/${fileName}`;

        const downloadUrl = await storageRepository.uploadFile(
          fullPath,
          file,
          (p) => setProgress(p)
        );

        onUploadComplete(downloadUrl, fullPath);
      }
    } catch (error) {
      logger.error('Upload failed', { error });
      if (onError && error instanceof Error) {
        onError(error);
      }
    } finally {
      setUploading(false);
      setProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (files) {
      await processFiles(files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files) {
      await processFiles(files);
    }
  };

  return (
    <div
      className={`${styles.container} ${isDragging ? styles.dragging : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      data-testid="photo-upload-dropzone"
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        id="photo-upload-input"
        disabled={uploading}
      />
      <label htmlFor="photo-upload-input" className={styles.uploadButton}>
        {uploading
          ? t('uploading', { progress: Math.round(progress) })
          : t('uploadPhotos')}
      </label>
      <p className={styles.hint}>
        {t('dragAndDropHint', { defaultValue: 'or drag and drop photos here' })}
      </p>
    </div>
  );
};
