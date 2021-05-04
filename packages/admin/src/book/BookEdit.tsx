import { Create, Edit, SimpleForm, TextInput } from "react-admin";
import RatingInput from "../shared/RatingInput";
import ShelfInput from "../shared/ShelfInput";
import transform from "../shared/transform";

const SHELVES = [
  { id: "Reading", name: "Reading" },
  { id: "Read", name: "Read" },
  { id: "DidNotFinish", name: "Did Not Finish" },
];

const TRANSFORM = transform();

export const BookCreate = (props) => (
  <Create {...props} transform={TRANSFORM}>
    <SimpleForm>
      <TextInput source="title" />
      <TextInput source="author" />
      <ShelfInput shelves={SHELVES} />
      <RatingInput />
    </SimpleForm>
  </Create>
);

export const BookEdit = (props) => (
  <Edit {...props} transform={TRANSFORM}>
    <SimpleForm>
      <TextInput source="title" />
      <TextInput source="author" />
      <ShelfInput shelves={SHELVES} />
      <RatingInput />
    </SimpleForm>
  </Edit>
);
