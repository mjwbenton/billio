import { TextInput } from "react-admin";
import { Create, Edit, Import } from "../shared/Edit";
import transform from "../shared/transform";
import SHELVES from "./MovieShelves";

const TRANSFORM = transform();

export const MovieCreate = (props) => (
  <Create {...props} transform={TRANSFORM} shelves={SHELVES}>
    <TextInput source="releaseYear" />
  </Create>
);

export const MovieEdit = (props) => (
  <Edit {...props} transform={TRANSFORM} shelves={SHELVES}>
    <TextInput source="releaseYear" />
  </Edit>
);

export const MovieImport = (props) => (
  <Import {...props} transform={TRANSFORM} shelves={SHELVES}></Import>
);
