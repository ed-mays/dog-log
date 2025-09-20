import { PetList } from './PetList';
import { usePetsStore } from '@store/pets.store';

export default function PetListPage() {
  const pets = usePetsStore((state) => state.pets);

  return (
    <div>
      <PetList pets={pets} /* pets, etc. */ />
    </div>
  );
}
