import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  type UploadTask,
} from 'firebase/storage';
import { storage } from '../firebase';
import { logger } from '@services/logService';

interface StorageRepository {
  uploadFile(
    path: string,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<string>;
  deleteFile(path: string): Promise<void>;
  getDownloadUrl(path: string): Promise<string>;
}

export class FirebaseStorageRepository implements StorageRepository {
  uploadFile(
    path: string,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const storageRef = ref(storage, path);
      const uploadTask: UploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (onProgress) {
            onProgress(progress);
          }
        },
        (error) => {
          logger.error('Error uploading file', { error, path });
          reject(error);
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadURL);
          } catch (error) {
            logger.error('Error getting download URL after upload', {
              error,
              path,
            });
            reject(error);
          }
        }
      );
    });
  }

  async deleteFile(path: string): Promise<void> {
    try {
      const storageRef = ref(storage, path);
      await deleteObject(storageRef);
    } catch (error) {
      logger.error('Error deleting file', { error, path });
      throw error;
    }
  }

  async getDownloadUrl(path: string): Promise<string> {
    try {
      const storageRef = ref(storage, path);
      return await getDownloadURL(storageRef);
    } catch (error) {
      logger.error('Error getting download URL', { error, path });
      throw error;
    }
  }
}

export const storageRepository = new FirebaseStorageRepository();
