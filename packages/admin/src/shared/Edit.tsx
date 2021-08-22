import {
  BooleanInput,
  SimpleForm,
  TextInput,
  Edit as RAEdit,
  Create as RACreate,
} from "react-admin";
import OverridableDateInput from "./OverridableDateInput";
import RatingInput from "./RatingInput";
import ShelfInput from "./ShelfInput";
import Title from "./Title";

const PosterDisplay = ({ record }: { record?: any }) =>
  record?.image?.url ? (
    <img src={record.image.url} alt={record.title} title={record.image.url} />
  ) : null;

function baseDataInputs() {
  return [<TextInput source="title" />];
}

function baseMetaInputs(shelves) {
  return [
    <ShelfInput shelves={shelves} />,
    <RatingInput />,
    <TextInput source="notes" />,
    <BooleanInput source="_overrideDates" />,
    <OverridableDateInput source="addedAt" />,
    <OverridableDateInput source="movedAt" />,
  ];
}

export const Edit = (props) => {
  const { children, shelves, ...rest } = props;
  return (
    <RAEdit {...rest} title={<Title />}>
      <SimpleForm>
        <PosterDisplay />
        {baseDataInputs()}
        {children}
        {baseMetaInputs(shelves)}
      </SimpleForm>
    </RAEdit>
  );
};

export const Create = (props) => {
  const { children, shelves, ...rest } = props;
  return (
    <RACreate {...rest}>
      <SimpleForm>
        {baseDataInputs()}
        {children}
        {baseMetaInputs(shelves)}
      </SimpleForm>
    </RACreate>
  );
};
