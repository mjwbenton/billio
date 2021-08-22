import { TextInput } from "react-admin";
import { Create, Edit } from "../shared/Edit";
import transform from "../shared/transform";
import SHELVES from "./BookShelves";

const TRANSFORM = transform();

export const BookCreate = (props) => (
  <Create {...props} transform={TRANSFORM} shelves={SHELVES}>
    <TextInput source="author" />
  </Create>
);

export const BookEdit = (props) => (
  <Edit {...props} transform={TRANSFORM} shelves={SHELVES}>
    <TextInput source="author" />
  </Edit>
);
