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

const BookShow = (props) => (
  <Show {...props}>
    <SimpleShowLayout>
      <TextField source="title" />
      <TextField source="author" />
      <ChipField source="shelf.name" label="Shelf" />
      <NumberField source="rating" />
      <DateField source="updatedAt" />
      <DateField source="createdAt" />
      <TextField source="id" />
    </SimpleShowLayout>
  </Show>
);

export default BookShow;
