import { TextField } from "react-admin";
import { List, Show } from "../shared/Display";

export const BookShow = (props) => (
  <Show {...props}>
    <TextField source="author" sortable={false} />
  </Show>
);

export const BookList = (props) => (
  <List {...props}>
    <TextField source="author" sortable={false} />
  </List>
);
