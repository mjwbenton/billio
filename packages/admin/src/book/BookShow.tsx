import {
  ChipField,
  Datagrid,
  DateField,
  List,
  NumberField,
  Show,
  SimpleShowLayout,
  TextField,
  ImageField,
} from "react-admin";
import EmptyPage from "../shared/EmptyPage";
import ListActions from "../shared/ListActions";
import Title from "../shared/Title";

function fields() {
  return [
    <ImageField source="image.url" label="" sortable={false} />,
    <TextField source="title" sortable={false} />,
    <TextField source="author" sortable={false} />,
    <ChipField source="shelf.name" label="Shelf" sortable={false} />,
    <NumberField source="rating" sortable={false} />,
    <DateField source="movedAt" sortable={false} />,
    <DateField source="addedAt" sortable={false} />,
    <TextField source="notes" sortable={false} />,
  ];
}

export const BookShow = (props) => (
  <Show {...props} title={<Title base="Book" />}>
    <SimpleShowLayout>{fields()}</SimpleShowLayout>
  </Show>
);

export const BookList = (props) => (
  <List
    {...props}
    exporter={false}
    actions={<ListActions />}
    empty={<EmptyPage />}
  >
    <Datagrid rowClick="show">{fields()}</Datagrid>
  </List>
);
