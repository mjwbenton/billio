import { Create, Edit, Import } from "../shared/Edit";
import transform from "../shared/transform";
import SHELVES from "./TvShelves";

const TRANSFORM = transform();

export const TvSeriesCreate = (props) => (
  <Create {...props} transform={TRANSFORM} shelves={SHELVES} />
);

export const TvSeriesEdit = (props) => (
  <Edit {...props} transform={TRANSFORM} shelves={SHELVES} />
);

export const TvSeriesImport = (props) => (
  <Import {...props} transform={TRANSFORM} shelves={SHELVES} />
);
