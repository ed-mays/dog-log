export interface Dog {
  id: string;
  name: string;
  breed: string;
}

type DogListProps = {
  dogs: Dog[];
  'data-TestId'?: string;
};

export function DogList({
  dogs,
  'data-TestId': dataTestId = 'dog-list',
}: DogListProps) {
  return (
    <table data-testid={dataTestId}>
      <thead>
        <tr>
          <th>Name</th>
          <th>Breed</th>
        </tr>
      </thead>
      <tbody>
        {dogs.map((dog) => (
          <tr key={dog.id}>
            <td>{dog.name}</td>
            <td>{dog.breed}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
