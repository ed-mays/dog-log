import { render, screen, waitFor, fireEvent } from '@test-utils';
import userEvent from '@testing-library/user-event';
import { PhotoUpload } from './PhotoUpload';
import { storageRepository } from '../../repositories/storageRepository';
import { vi } from 'vitest';

vi.mock('../../repositories/storageRepository', () => ({
  storageRepository: {
    uploadFile: vi.fn(),
  },
}));

describe('PhotoUpload', () => {
  const mockOnUploadComplete = vi.fn();
  const mockOnError = vi.fn();
  const storagePath = 'test/path';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders upload button', () => {
    render(
      <PhotoUpload
        storagePath={storagePath}
        onUploadComplete={mockOnUploadComplete}
      />
    );
    expect(screen.getByText('uploadPhotos')).toBeInTheDocument();
  });

  it('handles file upload successfully', async () => {
    const user = userEvent.setup();
    const file = new File(['dummy content'], 'test.png', { type: 'image/png' });
    const downloadUrl = 'https://example.com/test.png';
    vi.mocked(storageRepository.uploadFile).mockResolvedValue(downloadUrl);

    render(
      <PhotoUpload
        storagePath={storagePath}
        onUploadComplete={mockOnUploadComplete}
      />
    );

    const input = screen.getByLabelText('uploadPhotos');
    await user.upload(input, file);

    await waitFor(() => {
      expect(storageRepository.uploadFile).toHaveBeenCalledWith(
        expect.stringContaining(storagePath),
        file,
        expect.any(Function)
      );
      expect(mockOnUploadComplete).toHaveBeenCalledWith(
        downloadUrl,
        expect.stringContaining(storagePath)
      );
    });
  });

  it('validates file type', async () => {
    const file = new File(['dummy content'], 'test.txt', {
      type: 'text/plain',
    });

    render(
      <PhotoUpload
        storagePath={storagePath}
        onUploadComplete={mockOnUploadComplete}
        onError={mockOnError}
      />
    );

    const input = screen.getByLabelText('uploadPhotos');
    // Use fireEvent to bypass accept attribute check which userEvent respects
    // eslint-disable-next-line no-restricted-syntax
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith(expect.any(Error));
      expect(storageRepository.uploadFile).not.toHaveBeenCalled();
    });
  });
});
