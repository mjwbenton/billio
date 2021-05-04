import { ArrayInput, SelectInput, SimpleFormIterator } from "react-admin";

const PLATFORMS = [
  {
    id: "Playstation4",
    name: "Playstation 4",
  },
  {
    id: "NintendoSwitch",
    name: "Nintendo Switch",
  },
];

export default function PlatformsInput() {
  return (
    <ArrayInput source="platformIds">
      <SimpleFormIterator>
        <SelectInput source="" label="" choices={PLATFORMS} />
      </SimpleFormIterator>
    </ArrayInput>
  );
}
