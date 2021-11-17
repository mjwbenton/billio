import { NumberInput, SimpleForm, TextInput } from "react-admin";
import Import from "../import/Import";
import { baseMetaInputs, Create, Edit } from "../shared/Edit";
import transform from "../shared/transform";
import SearchExternalTvSeasonInput from "./SearchExternalTvSeasonInput";
import SHELVES from "./TvShelves";

const TRANSFORM = transform();

export const TvSeasonCreate = (props) => (
  <Create {...props} transform={TRANSFORM} shelves={SHELVES}>
    <TextInput source="seasonTitle" />
    <NumberInput source="seasonNumber" />
  </Create>
);

export const TvSeasonEdit = (props) => (
  <Edit {...props} transform={TRANSFORM} shelves={SHELVES}>
    <TextInput source="seasonTitle" />
    <NumberInput source="seasonNumber" />
  </Edit>
);

export const TvSeasonImport = () => (
  <Import transform={TRANSFORM}>
    <SimpleForm>
      <SearchExternalTvSeasonInput />
      {baseMetaInputs(SHELVES)}
    </SimpleForm>
  </Import>
);
