import {
  ArrayInput,
  Create,
  Edit,
  SelectInput,
  SimpleForm,
  SimpleFormIterator,
  TextInput,
} from "react-admin";
import RatingInput from "../shared/RatingInput";
import ShelfInput from "../shared/ShelfInput";
import transform from "../shared/transform";

const SHELVES = [
  { id: "Played", name: "Played" },
  { id: "Playing", name: "Playing" },
  { id: "GaveUp", name: "Gave Up" },
  { id: "Completed", name: "Completed" },
];

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

const TRANSFORM = transform((data: any) => {
  const { platforms, ...rest } = data;
  return {
    ...rest,
    platformIds: platforms.map(({ id }) => id),
  };
});

function PlatformsInput() {
  return (
    <ArrayInput source="platforms">
      <SimpleFormIterator>
        <SelectInput source="id" label="" choices={PLATFORMS} />
      </SimpleFormIterator>
    </ArrayInput>
  );
}

export const VideoGameEdit = (props) => (
  <Edit {...props} transform={TRANSFORM}>
    <SimpleForm>
      <TextInput source="title" />
      <PlatformsInput />
      <ShelfInput shelves={SHELVES} />
      <RatingInput />
    </SimpleForm>
  </Edit>
);

export const VideoGameCreate = (props) => (
  <Create {...props} transform={TRANSFORM}>
    <SimpleForm>
      <TextInput source="title" />
      <PlatformsInput />
      <ShelfInput shelves={SHELVES} />
      <RatingInput />
    </SimpleForm>
  </Create>
);

export default VideoGameEdit;
