import { Create, Edit, SimpleForm, TextInput } from "react-admin";
import RatingInput from "../shared/RatingInput";
import ShelfInput from "../shared/ShelfInput";
import Title from "../shared/Title";
import transform from "../shared/transform";
import SHELVES from "./BookShelves";

const TRANSFORM = transform();

export const BookCreate = (props) => (
  <Create {...props} transform={TRANSFORM} title="Add Book">
    <SimpleForm>
      <TextInput source="title" />
      <TextInput source="author" />
      <ShelfInput shelves={SHELVES} />
      <RatingInput />
    </SimpleForm>
  </Create>
);

export const BookEdit = (props) => (
  <Edit {...props} transform={TRANSFORM} title={<Title base="Book" />}>
    <SimpleForm>
      <BookInfo />
      <TextInput source="title" />
      <TextInput source="author" />
      <ShelfInput shelves={SHELVES} />
      <RatingInput />
    </SimpleForm>
  </Edit>
);

const BookInfo = ({ record }: { record?: any }) =>
  record?.image?.url ? (
    <img src={record.image.url} alt={record.title} title={record.image.url} />
  ) : null;
