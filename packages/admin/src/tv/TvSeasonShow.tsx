import { BooleanField, NumberField, TextField } from "react-admin";
import { List, Show } from "../shared/Display";

export const TvSeasonShow = (props) => (
  <Show {...props}>
    <NumberField source="seasonNumber" sortable={false} />
    <TextField source="seasonTitle" sortable={false} />
    <TextField source="releaseYear" sortable={false} />
    <BooleanField source="rewatch" sortable={false} />
  </Show>
);

export const TvSeasonList = (props) => (
  <List {...props}>
    <NumberField source="seasonNumber" sortable={false} />
    <TextField source="seasonTitle" sortable={false} />
    <TextField source="releaseYear" sortable={false} />
  </List>
);
