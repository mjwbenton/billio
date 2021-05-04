import {
  ChipField,
  Datagrid,
  DateField,
  List,
  NumberField,
  Show,
  SimpleShowLayout,
  TextField,
} from "react-admin";
import Title from "../shared/Title";

export const BookShow = (props) => (
  <Show {...props} title={<Title base="Book" />}>
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

export const BookList = (props) => (
  <List {...props}>
    <Datagrid rowClick="show">
      <TextField source="title" />
      <TextField source="author" />
      <ChipField source="shelf.name" label="Shelf" />
      <NumberField source="rating" />
      <DateField source="updatedAt" />
      <DateField source="createdAt" />
      <TextField source="id" />
    </Datagrid>
  </List>
);
