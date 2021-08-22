import {
  ChipField,
  Datagrid,
  DateField,
  ImageField,
  List as RAList,
  NumberField,
  Show as RAShow,
  SimpleShowLayout,
  TextField,
} from "react-admin";
import Title from "../shared/Title";
import EmptyPage from "../shared/EmptyPage";
import ListActions from "../shared/ListActions";

function baseDataFields() {
  return [
    <ImageField source="image.url" key="image" label="" sortable={false} />,
    <TextField source="title" key="title" sortable={false} />,
  ];
}

function baseMetaFields() {
  return [
    <ChipField
      source="shelf.name"
      key="shelf"
      label="Shelf"
      sortable={false}
    />,
    <NumberField source="rating" key="rating" sortable={false} />,
    <DateField source="movedAt" key="movedAt" showTime sortable={false} />,
    <DateField source="addedAt" key="addedAt" showTime sortable={false} />,
    <TextField source="notes" key="notes" sortable={false} />,
  ];
}

export const List = (props) => {
  return (
    <RAList
      {...props}
      exporter={false}
      actions={<ListActions />}
      empty={<EmptyPage />}
    >
      <Datagrid rowClick="show">
        {baseDataFields()}
        {props.children}
        {baseMetaFields()}
      </Datagrid>
    </RAList>
  );
};

export const Show = (props) => (
  <RAShow {...props} title={<Title />}>
    <SimpleShowLayout>
      {baseDataFields()}
      {props.children}
      {baseMetaFields()}
    </SimpleShowLayout>
  </RAShow>
);
