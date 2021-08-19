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
import Title from "../shared/Title";
import transform from "../shared/transform";
import SHELVES from "./VideoGameShelves";

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

const PlatformsInput = () => {
  return (
    <ArrayInput source="platforms">
      <SimpleFormIterator>
        <SelectInput source="id" label="" choices={PLATFORMS} />
      </SimpleFormIterator>
    </ArrayInput>
  );
};

const VideoGameInfo = ({ record }: { record?: any }) =>
  record?.image?.url ? (
    <img src={record.image.url} alt={record.title} title={record.image.url} />
  ) : null;

export const VideoGameEdit = (props) => (
  <Edit {...props} transform={TRANSFORM} title={<Title base="Video Game" />}>
    <SimpleForm>
      <VideoGameInfo />
      <TextInput source="title" />
      <PlatformsInput />
      <ShelfInput shelves={SHELVES} />
      <RatingInput />
    </SimpleForm>
  </Edit>
);

export const VideoGameCreate = (props) => (
  <Create {...props} transform={TRANSFORM} title="Add Video Game">
    <SimpleForm>
      <TextInput source="title" />
      <PlatformsInput />
      <ShelfInput shelves={SHELVES} />
      <RatingInput />
    </SimpleForm>
  </Create>
);
