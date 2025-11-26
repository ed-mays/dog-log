import { render, screen } from '@test-utils';
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
    expect(screen.getByText('noPhotos')).toBeInTheDocument();
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
    const buttons = screen.getAllByText('setAsMain');
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
    const buttons = screen.getAllByText('delete');
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
    const mainButton = screen.getByText('mainPhoto');
    expect(mainButton).toBeDisabled();
  });
});
