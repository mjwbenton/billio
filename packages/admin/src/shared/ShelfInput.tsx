import { SelectInput } from "react-admin";

export default function ShelfInput({
  shelves,
}: {
  shelves: Array<{ id: string; name: string }>;
}) {
  return <SelectInput source="shelf.id" label="Shelf" choices={shelves} />;
}
