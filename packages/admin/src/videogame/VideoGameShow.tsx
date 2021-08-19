import {
  ArrayField,
  ChipField,
  Datagrid,
  DateField,
  ImageField,
  List,
  NumberField,
  Show,
  SimpleShowLayout,
  SingleFieldList,
  TextField,
} from "react-admin";
import EmptyPage from "../shared/EmptyPage";
import ListActions from "../shared/ListActions";
import Title from "../shared/Title";

function fields() {
  return [
    <ImageField source="image.url" label="" sortable={false} />,
    <TextField source="title" sortable={false} />,
    <ArrayField source="platforms" sortable={false}>
      <SingleFieldList linkType={false}>
        <ChipField source="name" />
      </SingleFieldList>
    </ArrayField>,
    <ChipField source="shelf.name" label="Shelf" sortable={false} />,
    <NumberField source="rating" sortable={false} />,
    <DateField source="movedAt" sortable={false} />,
    <DateField source="addedAt" sortable={false} />,
  ];
}

export const VideoGameShow = (props) => (
  <Show {...props} title={<Title base="Video Game" />}>
    <SimpleShowLayout>{fields()}</SimpleShowLayout>
  </Show>
);

export const VideoGameList = (props) => {
  return (
    <List
      {...props}
      exporter={false}
      actions={<ListActions />}
      empty={<EmptyPage />}
    >
      <Datagrid rowClick="show">{fields()}</Datagrid>
    </List>
  );
};
