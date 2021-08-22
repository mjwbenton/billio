import { ArrayField, ChipField, SingleFieldList } from "react-admin";
import { List, Show } from "../shared/Display";

const PlatformInput = (props) => (
  <ArrayField {...props} source="platforms" sortable={false}>
    <SingleFieldList linkType={false}>
      <ChipField source="name" />
    </SingleFieldList>
  </ArrayField>
);

PlatformInput.defaultProps = {
  label: "Platforms",
  addLabel: true,
};

export const VideoGameShow = (props) => (
  <Show {...props}>
    <PlatformInput />
  </Show>
);

export const VideoGameList = (props) => (
  <List {...props}>
    <PlatformInput />
  </List>
);
