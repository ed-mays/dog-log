import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FirebaseStorageRepository } from './storageRepository';
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  type UploadTask,
} from 'firebase/storage';
import { logger } from '@services/logService';

// Mock firebase/storage
vi.mock('firebase/storage', () => ({
  ref: vi.fn(() => ({})),
  uploadBytesResumable: vi.fn(),
  getDownloadURL: vi.fn(),
  deleteObject: vi.fn(),
}));

// Mock logger
vi.mock('@services/logService', () => ({
  logger: {
    error: vi.fn(),
  },
}));

// Mock firebase app
vi.mock('../firebase', () => ({
  storage: {},
}));

describe('FirebaseStorageRepository', () => {
  let repository: FirebaseStorageRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new FirebaseStorageRepository();
  });

  describe('uploadFile', () => {
    const path = 'test/path/image.png';
    const file = new File(['content'], 'image.png', { type: 'image/png' });
    const downloadURL = 'https://example.com/image.png';

    it('uploads file and returns download URL', async () => {
      const mockUploadTask = {
        on: vi.fn((_event, _progress, _error, complete) => {
          // Simulate completion immediately
          complete();
        }),
        snapshot: { ref: {} },
      };
      vi.mocked(uploadBytesResumable).mockReturnValue(
        mockUploadTask as unknown as UploadTask
      );
      vi.mocked(getDownloadURL).mockResolvedValue(downloadURL);

      const result = await repository.uploadFile(path, file);

      expect(ref).toHaveBeenCalledWith(expect.anything(), path);
      expect(uploadBytesResumable).toHaveBeenCalledWith(
        expect.anything(),
        file
      );
      expect(result).toBe(downloadURL);
    });

    it('reports progress', async () => {
      const onProgress = vi.fn();
      const mockUploadTask = {
        on: vi.fn((_event, progressCallback, _error, complete) => {
          // Simulate progress
          progressCallback({ bytesTransferred: 50, totalBytes: 100 });
          complete();
        }),
        snapshot: { ref: {} },
      };
      vi.mocked(uploadBytesResumable).mockReturnValue(
        mockUploadTask as unknown as UploadTask
      );
      vi.mocked(getDownloadURL).mockResolvedValue(downloadURL);

      await repository.uploadFile(path, file, onProgress);

      expect(onProgress).toHaveBeenCalledWith(50);
    });

    it('handles upload error', async () => {
      const error = new Error('Upload failed');
      const mockUploadTask = {
        on: vi.fn((_event, _progress, errorCallback) => {
          errorCallback(error);
        }),
      };
      vi.mocked(uploadBytesResumable).mockReturnValue(
        mockUploadTask as unknown as UploadTask
      );

      await expect(repository.uploadFile(path, file)).rejects.toThrow(error);
      expect(logger.error).toHaveBeenCalledWith('Error uploading file', {
        error,
        path,
      });
    });

    it('handles getDownloadURL error after upload', async () => {
      const error = new Error('URL failed');
      const mockUploadTask = {
        on: vi.fn((_event, _progress, _errorCallback, complete) => {
          complete();
        }),
        snapshot: { ref: {} },
      };
      vi.mocked(uploadBytesResumable).mockReturnValue(
        mockUploadTask as unknown as UploadTask
      );
      vi.mocked(getDownloadURL).mockRejectedValue(error);

      await expect(repository.uploadFile(path, file)).rejects.toThrow(error);
      expect(logger.error).toHaveBeenCalledWith(
        'Error getting download URL after upload',
        { error, path }
      );
    });
  });

  describe('deleteFile', () => {
    const path = 'test/path/image.png';

    it('deletes file successfully', async () => {
      vi.mocked(deleteObject).mockResolvedValue(undefined);

      await repository.deleteFile(path);

      expect(ref).toHaveBeenCalledWith(expect.anything(), path);
      expect(deleteObject).toHaveBeenCalledWith(expect.anything());
    });

    it('handles delete error', async () => {
      const error = new Error('Delete failed');
      vi.mocked(deleteObject).mockRejectedValue(error);

      await expect(repository.deleteFile(path)).rejects.toThrow(error);
      expect(logger.error).toHaveBeenCalledWith('Error deleting file', {
        error,
        path,
      });
    });
  });

  describe('getDownloadUrl', () => {
    const path = 'test/path/image.png';
    const url = 'https://example.com/image.png';

    it('gets download URL successfully', async () => {
      vi.mocked(getDownloadURL).mockResolvedValue(url);

      const result = await repository.getDownloadUrl(path);

      expect(ref).toHaveBeenCalledWith(expect.anything(), path);
      expect(getDownloadURL).toHaveBeenCalledWith(expect.anything());
      expect(result).toBe(url);
    });

    it('handles error getting download URL', async () => {
      const error = new Error('URL failed');
      vi.mocked(getDownloadURL).mockRejectedValue(error);

      await expect(repository.getDownloadUrl(path)).rejects.toThrow(error);
      expect(logger.error).toHaveBeenCalledWith('Error getting download URL', {
        error,
        path,
      });
    });
  });
});
