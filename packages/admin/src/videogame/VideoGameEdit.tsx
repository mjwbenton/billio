import { ArrayInput, SelectInput, SimpleFormIterator } from "react-admin";
import { Create, Edit, Import } from "../shared/Edit";
import transform from "../shared/transform";
import SHELVES from "./VideoGameShelves";

const PLATFORMS = [
  {
    id: "SteamDeck",
    name: "Steam Deck",
  },
  {
    id: "Playstation4",
    name: "Playstation 4",
  },
  {
    id: "NintendoSwitch",
    name: "Nintendo Switch",
  },
  {
    id: "Nintendo3DS",
    name: "Nintendo 3DS",
  },
  {
    id: "Playstation3",
    name: "Playstation 3",
  },
];

const TRANSFORM = transform((data: any) => {
  const { platforms, ...rest } = data;
  return {
    ...rest,
    platformIds: platforms.map(({ id }) => id),
  };
});

const PlatformsInput = () => (
  <ArrayInput source="platforms">
    <SimpleFormIterator>
      <SelectInput source="id" label="" choices={PLATFORMS} />
    </SimpleFormIterator>
  </ArrayInput>
);

export const VideoGameEdit = (props) => (
  <Edit {...props} transform={TRANSFORM} shelves={SHELVES}>
    <PlatformsInput />
  </Edit>
);

export const VideoGameCreate = (props) => (
  <Create {...props} transform={TRANSFORM} shelves={SHELVES}>
    <PlatformsInput />
  </Create>
);

export const VideoGameImport = () => (
  <Import shelves={SHELVES} transform={TRANSFORM}>
    <PlatformsInput />
  </Import>
);
