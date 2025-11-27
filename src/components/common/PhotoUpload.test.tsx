import { render, screen, waitFor, fireEvent } from '@test-utils';
import styles from './PhotoUpload.module.css';
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
    expect(screen.getByText('Upload Photos')).toBeInTheDocument();
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

    const input = screen.getByLabelText('Upload Photos');
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

    const input = screen.getByLabelText('Upload Photos');
    // Use fireEvent to bypass accept attribute check which userEvent respects
    // eslint-disable-next-line no-restricted-syntax
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith(expect.any(Error));
      expect(storageRepository.uploadFile).not.toHaveBeenCalled();
    });
  });

  it('handles file drop', async () => {
    const file = new File(['dummy content'], 'test.png', { type: 'image/png' });
    const downloadUrl = 'https://example.com/test.png';
    vi.mocked(storageRepository.uploadFile).mockResolvedValue(downloadUrl);

    render(
      <PhotoUpload
        storagePath={storagePath}
        onUploadComplete={mockOnUploadComplete}
      />
    );

    const dropZone = screen.getByTestId('photo-upload-dropzone');

    // eslint-disable-next-line no-restricted-syntax
    fireEvent.drop(dropZone, {
      dataTransfer: {
        files: [file],
      },
    });

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

  it('shows visual feedback on drag over', () => {
    render(
      <PhotoUpload
        storagePath={storagePath}
        onUploadComplete={mockOnUploadComplete}
      />
    );

    const dropZone = screen.getByTestId('photo-upload-dropzone');

    // eslint-disable-next-line no-restricted-syntax
    fireEvent.dragOver(dropZone);
    expect(dropZone).toHaveClass(styles.dragging);

    // eslint-disable-next-line no-restricted-syntax
    fireEvent.dragLeave(dropZone);
    expect(dropZone).not.toHaveClass(styles.dragging);
  });
});
