import { useContext } from 'react';
import { FeatureFlagsContext } from './FeatureFlagsContext';

export function useFeatureFlagsContext() {
  const context = useContext(FeatureFlagsContext);
  if (!context) {
    throw new Error(
      'useFeatureFlagsContext must be used within FeatureFlagsProvider'
    );
  }
  return context;
}
