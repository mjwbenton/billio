import { BooleanInput, NumberInput, SimpleForm, TextInput } from "react-admin";
import Import from "../import/Import";
import { baseMetaInputs, Create, Edit } from "../shared/Edit";
import transform from "../shared/transform";
import SearchExternalTvSeasonInput from "./SearchExternalTvSeasonInput";
import { SEASON_SHELVES } from "./TvShelves";

const TRANSFORM = transform();

export const TvSeasonCreate = (props) => (
  <Create {...props} transform={TRANSFORM} shelves={SEASON_SHELVES}>
    <TextInput source="seasonTitle" />
    <NumberInput source="seasonNumber" />
    <TextInput source="releaseYear" />
    <BooleanInput source="rewatch" />
  </Create>
);

export const TvSeasonEdit = (props) => (
  <Edit {...props} transform={TRANSFORM} shelves={SEASON_SHELVES}>
    <TextInput source="seasonTitle" />
    <NumberInput source="seasonNumber" />
    <TextInput source="releaseYear" />
    <BooleanInput source="rewatch" />
  </Edit>
);

export const TvSeasonImport = () => (
  <Import transform={TRANSFORM}>
    <SimpleForm>
      <SearchExternalTvSeasonInput />
      <BooleanInput source="rewatch" />
      {baseMetaInputs(SEASON_SHELVES)}
    </SimpleForm>
  </Import>
);
