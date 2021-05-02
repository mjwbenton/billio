import { SelectInput } from "react-admin";

const CHOICES = Array.from({ length: 10 }, (_, i) => ({
  name: (i + 1).toString(),
  id: i + 1,
}));

export default function RatingInput() {
  return <SelectInput source="rating" label="Rating" choices={CHOICES} />;
}
