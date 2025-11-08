import { PetList } from '../components/PetList.tsx';
import { usePetsStore } from '@store/pets.store';

export default function PetListPage() {
  const pets = usePetsStore((state) => state.pets);

  return (
    <div>
      <PetList data-testid="pet-list" pets={pets} /* pets, etc. */ />
    </div>
  );
}
