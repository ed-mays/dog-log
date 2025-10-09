import { PetList } from './PetList';
import { usePetsStore } from '@store/pets.store';
import { useEffect, useState } from 'react';
import { loadNamespace } from '../../i18n';

export default function PetListPage() {
  const pets = usePetsStore((state) => state.pets);
  const [nsReady, setNsReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    Promise.all([loadNamespace('petList'), loadNamespace('petProperties')]).then(
      () => {
        if (mounted) setNsReady(true);
      }
    );
    return () => {
      mounted = false;
    };
  }, []);

  if (!nsReady) return null;

  return (
    <div>
      <PetList data-testid="pet-list" pets={pets} /* pets, etc. */ />
    </div>
  );
}
