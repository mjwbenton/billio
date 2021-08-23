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
import { default as InternalImport } from "../import/Import";
import SearchExternalInput from "../import/SearchExternalInput";

const PosterDisplay = ({ record }: { record?: any }) =>
  record?.image?.url ? (
    <img src={record.image.url} alt={record.title} title={record.image.url} />
  ) : null;

function baseDataInputs() {
  return [<TextInput key="title" source="title" />];
}

function baseMetaInputs(shelves) {
  return [
    <ShelfInput key="shelf" shelves={shelves} />,
    <RatingInput key="rating" />,
    <TextInput key="notes" source="notes" />,
    <BooleanInput key="_overrideDates" source="_overrideDates" />,
    <OverridableDateInput key="addedAt" source="addedAt" />,
    <OverridableDateInput key="movedAt" source="movedAt" />,
  ];
}

export const Edit = ({ children, shelves, ...rest }) => {
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

export const Create = ({ children, shelves, ...rest }) => {
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

export const Import = ({ shelves, children, transform }) => {
  return (
    <InternalImport transform={transform}>
      <SimpleForm>
        <SearchExternalInput source="id" />
        {children}
        {baseMetaInputs(shelves)}
      </SimpleForm>
    </InternalImport>
  );
};
