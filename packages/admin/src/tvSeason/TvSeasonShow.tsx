import { NumberField, TextField } from "react-admin";
import { List, Show } from "../shared/Display";

export const TvSeasonShow = (props) => (
  <Show {...props}>
    <TextField source="seasonTitle" sortable={false} />
    <NumberField source="seasonNumber" sortable={false} />
  </Show>
);

export const TvSeasonList = (props) => (
  <List {...props}>
    <TextField source="seasonTitle" sortable={false} />
    <NumberField source="seasonNumber" sortable={false} />
  </List>
);
