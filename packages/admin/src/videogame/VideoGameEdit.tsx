import {
  ArrayInput,
  BooleanInput,
  NumberInput,
  SelectInput,
  SimpleFormIterator,
} from "react-admin";
import { Create, Edit, Import } from "../shared/Edit";
import transform from "../shared/transform";
import SHELVES from "./VideoGameShelves";

const DEVICES = [
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
  {
    id: "NintendoSwitch2",
    name: "Nintendo Switch 2",
  },
  {
    id: "IOS",
    name: "iOS",
  },
  {
    id: "TrimUiBrick",
    name: "Trim UI Brick",
  },
  {
    id: "RetroidPocketMiniV2",
    name: "Retroid Pocket Mini V2",
  },
  {
    id: "RetroidPocketFlip2",
    name: "Retroid Pocket Flip 2",
  },
];

const PLATFORMS = [
  {
    id: "Steam",
    name: "Steam",
  },
  {
    id: "NintendoGameBoy",
    name: "Game Boy",
  },
  {
    id: "NintendoGameBoyColor",
    name: "Game Boy Color",
  },
  {
    id: "NintendoGameBoyAdvance",
    name: "Game Boy Advance",
  },
  {
    id: "NintendoSNES",
    name: "Super Nintendo",
  },
  {
    id: "NintendoWiiU",
    name: "Nintendo WiiU",
  },
  {
    id: "NintendoSwitch",
    name: "Nintendo Switch",
  },
  {
    id: "NintendoDS",
    name: "Nintendo DS",
  },
  {
    id: "Nintendo3DS",
    name: "Nintendo 3DS",
  },
  {
    id: "Playstation3",
    name: "Playstation 3",
  },
  {
    id: "Playstation4",
    name: "Playstation 4",
  },
  {
    id: "IOS",
    name: "iOS",
  },
  {
    id: "SegaMegaDrive",
    name: "Sega Mega Drive",
  },
  {
    id: "SegaSaturn",
    name: "Sega Saturn",
  },
  {
    id: "TurboGrafx16",
    name: "TurboGrafx-16",
  },
];

const TRANSFORM = transform((data: any) => {
  const { platforms, devices, ...rest } = data;
  return {
    ...rest,
    platformIds: platforms.map(({ id }) => id),
    deviceIds: devices.map(({ id }) => id),
  };
});

const DevicesInput = () => (
  <ArrayInput source="devices">
    <SimpleFormIterator>
      <SelectInput source="id" label="" choices={DEVICES} />
    </SimpleFormIterator>
  </ArrayInput>
);

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
    <DevicesInput />
    <BooleanInput source="replay" />
    <NumberInput source="hoursPlayed" />
  </Edit>
);

export const VideoGameCreate = (props) => (
  <Create {...props} transform={TRANSFORM} shelves={SHELVES}>
    <PlatformsInput />
    <DevicesInput />
    <BooleanInput source="replay" />
    <NumberInput source="hoursPlayed" />
  </Create>
);

export const VideoGameImport = () => (
  <Import shelves={SHELVES} transform={TRANSFORM}>
    <PlatformsInput />
    <DevicesInput />
    <BooleanInput source="replay" />
    <NumberInput source="hoursPlayed" />
  </Import>
);
