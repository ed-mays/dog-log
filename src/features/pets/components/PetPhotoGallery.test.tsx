import { render, screen, waitFor } from '@test-utils';
import userEvent from '@testing-library/user-event';
import { PetPhotoGallery } from './PetPhotoGallery';
import { vi } from 'vitest';

// Mock feature flag
vi.mock('../../../featureFlags/hooks/useFeatureFlag', () => ({
  useFeatureFlag: vi.fn().mockReturnValue(true),
}));

describe('PetPhotoGallery', () => {
  const mockPhotos = [
    { path: 'path/1', url: 'url1', createdAt: '2023-01-01' },
    { path: 'path/2', url: 'url2', createdAt: '2023-01-02' },
  ];
  const mockOnSetMainPhoto = vi.fn();
  const mockOnDeletePhoto = vi.fn();

  it('renders photos', () => {
    render(
      <PetPhotoGallery
        photos={mockPhotos}
        onSetMainPhoto={mockOnSetMainPhoto}
        onDeletePhoto={mockOnDeletePhoto}
      />
    );
    expect(screen.getAllByRole('img')).toHaveLength(2);
  });

  it('renders empty state message when no photos provided', () => {
    render(
      <PetPhotoGallery
        photos={[]}
        onSetMainPhoto={mockOnSetMainPhoto}
        onDeletePhoto={mockOnDeletePhoto}
      />
    );
    expect(screen.getByText('No photos yet')).toBeInTheDocument();
  });

  it('does not render when feature flag is disabled', async () => {
    // Mock feature flag to return false
    const { useFeatureFlag } = await import(
      '../../../featureFlags/hooks/useFeatureFlag'
    );
    vi.mocked(useFeatureFlag).mockReturnValue(false);

    const { container } = render(
      <PetPhotoGallery
        photos={mockPhotos}
        onSetMainPhoto={mockOnSetMainPhoto}
        onDeletePhoto={mockOnDeletePhoto}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('calls onSetMainPhoto when button clicked', async () => {
    // Reset flag to true
    const { useFeatureFlag } = await import(
      '../../../featureFlags/hooks/useFeatureFlag'
    );
    vi.mocked(useFeatureFlag).mockReturnValue(true);

    const user = userEvent.setup();
    render(
      <PetPhotoGallery
        photos={mockPhotos}
        onSetMainPhoto={mockOnSetMainPhoto}
        onDeletePhoto={mockOnDeletePhoto}
      />
    );
    const buttons = screen.getAllByText('Set as Main');
    await user.click(buttons[0]);
    expect(mockOnSetMainPhoto).toHaveBeenCalledWith(mockPhotos[0]);
  });

  it('calls onDeletePhoto when button clicked', async () => {
    const user = userEvent.setup();
    render(
      <PetPhotoGallery
        photos={mockPhotos}
        onSetMainPhoto={mockOnSetMainPhoto}
        onDeletePhoto={mockOnDeletePhoto}
      />
    );
    const buttons = screen.getAllByText('Delete');
    await user.click(buttons[0]);
    expect(mockOnDeletePhoto).toHaveBeenCalledWith(mockPhotos[0]);
  });

  it('disables set as main button for current main photo', () => {
    render(
      <PetPhotoGallery
        photos={mockPhotos}
        mainPhotoUrl="url1"
        onSetMainPhoto={mockOnSetMainPhoto}
        onDeletePhoto={mockOnDeletePhoto}
      />
    );
    const mainButton = screen.getByText('Main Photo');
    expect(mainButton).toBeDisabled();
  });

  it('shows star icon for main photo', () => {
    render(
      <PetPhotoGallery
        photos={mockPhotos}
        mainPhotoUrl="url1"
        onSetMainPhoto={mockOnSetMainPhoto}
        onDeletePhoto={mockOnDeletePhoto}
      />
    );
    // The star icon is inside a div with title="Main Photo" (key from t('mainPhoto'))
    // Since we are mocking translation, we need to check what t('mainPhoto') returns.
    // In the test setup, it likely returns 'Main Photo' or the key if not configured.
    // However, we can also search for the icon by testid if we added one, or by title.
    // Let's assume t('mainPhoto') returns 'Main Photo' based on previous tests.
    expect(screen.getByTitle('Main Photo')).toBeInTheDocument();
  });

  it('opens lightbox when photo is clicked', async () => {
    const user = userEvent.setup();
    render(
      <PetPhotoGallery
        photos={mockPhotos}
        onSetMainPhoto={mockOnSetMainPhoto}
        onDeletePhoto={mockOnDeletePhoto}
      />
    );

    // Click on the first photo image
    const images = screen.getAllByRole('img', { name: 'Pet' });
    await user.click(images[0]);

    // Dialog should be open and show the full size image
    // We look for the image inside the dialog which has alt="Pet Full Size"
    expect(await screen.findByAltText('Pet Full Size')).toBeInTheDocument();
  });

  it('closes lightbox when close button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <PetPhotoGallery
        photos={mockPhotos}
        onSetMainPhoto={mockOnSetMainPhoto}
        onDeletePhoto={mockOnDeletePhoto}
      />
    );

    // Open lightbox
    const images = screen.getAllByRole('img', { name: 'Pet' });
    await user.click(images[0]);
    expect(await screen.findByAltText('Pet Full Size')).toBeInTheDocument();

    // Click close button
    const closeButton = screen.getByRole('button', { name: /close/i });
    await user.click(closeButton);

    // Dialog should be closed (image not visible)
    await waitFor(() => {
      expect(screen.queryByAltText('Pet Full Size')).not.toBeInTheDocument();
    });
  });
});
