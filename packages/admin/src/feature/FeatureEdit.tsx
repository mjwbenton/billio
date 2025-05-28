import { BooleanInput, TextInput } from "react-admin";
import { Create, Edit, Import } from "../shared/Edit";
import transform from "../shared/transform";
import SHELVES from "./FeatureShelves";

const TRANSFORM = transform();

export const FeatureCreate = (props) => (
  <Create {...props} transform={TRANSFORM} shelves={SHELVES}>
    <TextInput source="releaseYear" />
    <BooleanInput source="rewatch" />
  </Create>
);

export const FeatureEdit = (props) => (
  <Edit {...props} transform={TRANSFORM} shelves={SHELVES}>
    <TextInput source="releaseYear" />
    <BooleanInput source="rewatch" />
  </Edit>
);

export const FeatureImport = (props) => (
  <Import {...props} transform={TRANSFORM} shelves={SHELVES}>
    <BooleanInput source="rewatch" />
  </Import>
);
