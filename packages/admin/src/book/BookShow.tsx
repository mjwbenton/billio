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

function fields() {
  return [
    <TextField source="title" sortable={false} />,
    <TextField source="author" sortable={false} />,
    <ChipField source="shelf.name" label="Shelf" sortable={false} />,
    <NumberField source="rating" sortable={false} />,
    <DateField source="updatedAt" sortable={false} />,
    <DateField source="createdAt" sortable={false} />,
  ];
}

export const BookShow = (props) => (
  <Show {...props} title={<Title base="Book" />}>
    <SimpleShowLayout>{fields()}</SimpleShowLayout>
  </Show>
);

export const BookList = (props) => (
  <List {...props}>
    <Datagrid rowClick="show">{fields()}</Datagrid>
  </List>
);
