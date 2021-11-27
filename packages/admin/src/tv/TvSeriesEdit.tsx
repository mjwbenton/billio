import { TextInput } from "react-admin";
import { Create, Edit, Import } from "../shared/Edit";
import transform from "../shared/transform";
import { SERIES_SHELVES } from "./TvShelves";

const TRANSFORM = transform();

export const TvSeriesCreate = (props) => (
  <Create {...props} transform={TRANSFORM} shelves={SERIES_SHELVES}>
    <TextInput source="releaseYear" />
  </Create>
);

export const TvSeriesEdit = (props) => (
  <Edit {...props} transform={TRANSFORM} shelves={SERIES_SHELVES}>
    <TextInput source="releaseYear" />
  </Edit>
);

export const TvSeriesImport = (props) => (
  <Import {...props} transform={TRANSFORM} shelves={SERIES_SHELVES} />
);
