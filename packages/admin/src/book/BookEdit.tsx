import {
  BooleanInput,
  Create,
  DateTimeInput,
  Edit,
  SimpleForm,
  TextInput,
} from "react-admin";
import { useFormState } from "react-final-form";
import OverridableDateInput from "../shared/OverridableDateInput";
import RatingInput from "../shared/RatingInput";
import ShelfInput from "../shared/ShelfInput";
import Title from "../shared/Title";
import transform from "../shared/transform";
import SHELVES from "./BookShelves";

const TRANSFORM = transform();

const fields = () => {
  return [
    <TextInput source="title" />,
    <TextInput source="author" />,
    <ShelfInput shelves={SHELVES} />,
    <RatingInput />,
    <TextInput source="notes" />,
    <BooleanInput source="_overrideDates" />,
    <OverridableDateInput source="addedAt" />,
    <OverridableDateInput source="movedAt" />,
  ];
};

export const BookCreate = (props) => (
  <Create {...props} transform={TRANSFORM} title="Add Book">
    <SimpleForm>{fields()}</SimpleForm>
  </Create>
);

export const BookEdit = (props) => (
  <Edit {...props} transform={TRANSFORM} title={<Title base="Book" />}>
    <SimpleForm>
      <BookInfo />
      {fields()}
    </SimpleForm>
  </Edit>
);

const BookInfo = ({ record }: { record?: any }) =>
  record?.image?.url ? (
    <img src={record.image.url} alt={record.title} title={record.image.url} />
  ) : null;
