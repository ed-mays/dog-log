import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Alert, Link, Typography, Box, Tabs, Tab } from '@mui/material';
import { LinkedVetList } from '@features/pets/components/LinkedVetList';
import { PetInfoTable } from '@features/pets/components/PetInfoTable';
import { PetActions } from '@features/pets/components/PetActions';
import { usePetDetails } from '@features/pets/hooks/usePetDetails';
import { PhotoUpload } from '@components/common/PhotoUpload';
import { PetPhotoGallery } from '@features/pets/components/PetPhotoGallery';
import { FeedingList } from '@features/feedings/components/FeedingList';
import { FeedingForm } from '@features/feedings/components/FeedingForm';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`pet-tabpanel-${index}`}
      aria-labelledby={`pet-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `pet-tab-${index}`,
    'aria-controls': `pet-tabpanel-${index}`,
  };
}

export default function PetDetailsPage() {
  const { t } = useTranslation('common');
  const {
    pet,
    vetLinks,
    loadingVets,
    saving,
    error,
    vetsEnabled,
    vetLinkingEnabled,
    petActionsEnabled,
    petPhotosEnabled,
    feedingsEnabled,
    feedings,
    handleDelete,
    handlePhotoUpload,
    handleSetMainPhoto,
    handleDeletePhoto,
    handleAddFeeding,
    handleDeleteFeeding,
    navigate,
    nsReady,
  } = usePetDetails();

  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  if (!nsReady) return null;

  if (!pet) {
    return (
      <Alert severity="warning" role="alert">
        {t('notFound', { defaultValue: 'Not found' })}
      </Alert>
    );
  }

  return (
    <div>
      <Typography variant="h5" component="h1" gutterBottom>
        {t('details', { defaultValue: 'Details' })}
      </Typography>

      {error && (
        <Alert severity="error" role="alert" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {saving && (
        <Alert severity="info" role="alert" sx={{ mb: 2 }}>
          {t('saving', { defaultValue: 'Saving...' })}
        </Alert>
      )}

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="pet details tabs"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab
            label={t('details', { defaultValue: 'Details' })}
            value={0}
            {...a11yProps(0)}
          />
          {petPhotosEnabled && (
            <Tab
              label={t('photos', { defaultValue: 'Photos' })}
              value={1}
              {...a11yProps(1)}
            />
          )}
          {vetsEnabled && vetLinkingEnabled && (
            <Tab
              label={t('linkedVeterinarians', {
                ns: 'veterinarians',
                defaultValue: 'Veterinarians',
              })}
              value={2}
              {...a11yProps(2)}
            />
          )}
          {feedingsEnabled && (
            <Tab
              label={t('feedings', {
                ns: 'feedings',
                defaultValue: 'Feedings',
              })}
              value={3}
              {...a11yProps(3)}
            />
          )}
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <PetInfoTable pet={pet} />
        {petActionsEnabled && (
          <Box sx={{ mt: 4 }}>
            <PetActions
              pet={pet}
              onEdit={() => navigate(`/pets/${pet.id}/edit`)}
              onDelete={handleDelete}
              deleteError={error}
              isDeleting={saving}
            />
          </Box>
        )}
      </TabPanel>

      {petPhotosEnabled && (
        <TabPanel value={tabValue} index={1}>
          <div className="flex justify-between items-center mb-4">
            <Typography variant="h6" component="h2">
              {t('photos', { defaultValue: 'Photos' })}
            </Typography>
            <PhotoUpload
              storagePath={`users/${pet.createdBy}/pets/${pet.id}/photos`}
              onUploadComplete={handlePhotoUpload}
              onError={(err) => console.error(err)}
            />
          </div>
          <PetPhotoGallery
            photos={pet.photos || []}
            mainPhotoUrl={pet.mainPhotoUrl}
            onSetMainPhoto={handleSetMainPhoto}
            onDeletePhoto={handleDeletePhoto}
          />
        </TabPanel>
      )}

      {vetsEnabled && vetLinkingEnabled && (
        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" component="h2" gutterBottom>
            {t('linkedVeterinarians', {
              ns: 'veterinarians',
              defaultValue: 'Linked Veterinarians',
            })}
          </Typography>
          <LinkedVetList loading={loadingVets} links={vetLinks} />
        </TabPanel>
      )}

      {feedingsEnabled && (
        <TabPanel value={tabValue} index={3}>
          <Typography variant="h6" component="h2" gutterBottom>
            {t('feedings', {
              ns: 'feedings',
              defaultValue: 'Feedings',
            })}
          </Typography>
          <Box sx={{ mb: 4 }}>
            <FeedingForm onSubmit={handleAddFeeding} />
          </Box>
          <FeedingList feedings={feedings} onDelete={handleDeleteFeeding} />
        </TabPanel>
      )}

      <div style={{ marginTop: '1rem' }}>
        <Link component={RouterLink} to="/pets">
          {t('back', { defaultValue: 'Back' })}
        </Link>
      </div>
    </div>
  );
}
