import {
  ArrayField,
  BooleanField,
  ChipField,
  NumberField,
  SingleFieldList,
} from "react-admin";
import { List, Show } from "../shared/Display";

const DevicesShow = (props) => (
  <ArrayField {...props} source="devices" sortable={false}>
    <SingleFieldList linkType={false}>
      <ChipField source="name" />
    </SingleFieldList>
  </ArrayField>
);

DevicesShow.defaultProps = {
  label: "Devices",
  addLabel: true,
};

const PlatformsShow = (props) => (
  <ArrayField {...props} source="platforms" sortable={false}>
    <SingleFieldList linkType={false}>
      <ChipField source="name" />
    </SingleFieldList>
  </ArrayField>
);

PlatformsShow.defaultProps = {
  label: "Platforms",
  addLabel: true,
};

export const VideoGameShow = (props) => (
  <Show {...props}>
    <PlatformsShow />
    <DevicesShow />
    <BooleanField source="replay" sortable={false} />
    <NumberField source="hoursPlayed" sortable={false} />
  </Show>
);

export const VideoGameList = (props) => (
  <List {...props}>
    <PlatformsShow />
  </List>
);
