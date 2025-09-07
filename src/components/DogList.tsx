export interface Dog {
  id: string;
  name: string;
  breed: string;
}

type DogListProps = {
  dogs: Dog[];
};

export function DogList({ dogs }: DogListProps) {
  return (
    <ul>
      {dogs.map((dog) => (
        <li key={dog.id}>
          {dog.name} ({dog.breed})
        </li>
      ))}
    </ul>
  );
}
