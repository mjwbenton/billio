import {
  ArrayField,
  ChipField,
  DateField,
  NumberField,
  Show,
  SimpleShowLayout,
  SingleFieldList,
  TextField,
} from "react-admin";

const VideoGameShow = (props) => (
  <Show {...props}>
    <SimpleShowLayout>
      <TextField source="title" />
      <ArrayField source="platforms">
        <SingleFieldList>
          <ChipField source="name" />
        </SingleFieldList>
      </ArrayField>
      <ChipField source="shelf.name" label="Shelf" />
      <NumberField source="rating" />
      <DateField source="updatedAt" />
      <DateField source="createdAt" />
      <TextField source="id" />
    </SimpleShowLayout>
  </Show>
);

export default VideoGameShow;
