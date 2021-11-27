import { TextField } from "react-admin";
import { List, Show } from "../shared/Display";

export const TvSeriesShow = (props) => (
  <Show {...props}>
    <TextField source="releaseYear" sortable={false} />
  </Show>
);

export const TvSeriesList = (props) => (
  <List {...props}>
    <TextField source="releaseYear" sortable={false} />
  </List>
);
