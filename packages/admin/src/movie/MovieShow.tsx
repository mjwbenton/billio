import { TextField } from "react-admin";
import { List, Show } from "../shared/Display";

export const MovieShow = (props) => (
  <Show {...props}>
    <TextField source="releaseYear" sortable={false} />
  </Show>
);

export const MovieList = (props) => (
  <List {...props}>
    <TextField source="releaseYear" sortable={false} />
  </List>
);
