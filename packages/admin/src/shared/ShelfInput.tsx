import { SelectInput } from "react-admin";

export default function ShelfInput({
  shelves,
}: {
  shelves: Array<{ id: string; name: string }>;
}) {
  return <SelectInput source="shelfId" label="Shelf" choices={shelves} />;
}
