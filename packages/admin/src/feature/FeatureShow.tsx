import { BooleanField, TextField } from "react-admin";
import { List, Show } from "../shared/Display";

export const FeatureShow = (props) => (
  <Show {...props}>
    <TextField source="releaseYear" sortable={false} />
    <BooleanField source="rewatch" sortable={false} />
  </Show>
);

export const FeatureList = (props) => (
  <List {...props}>
    <TextField source="releaseYear" sortable={false} />
  </List>
);
