import { useContext } from 'react';
import { FeatureFlagsContext } from '../components/FeatureFlagsContext.tsx';

export function useFeatureFlagsContext() {
  const context = useContext(FeatureFlagsContext);
  if (!context) {
    throw new Error(
      'useFeatureFlagsContext must be used within FeatureFlagsProvider'
    );
  }
  return context;
}
