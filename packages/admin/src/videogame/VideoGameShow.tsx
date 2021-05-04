import React from "react";
import {
  ArrayField,
  ChipField,
  Datagrid,
  DateField,
  List,
  NumberField,
  Show,
  SimpleShowLayout,
  SingleFieldList,
  TextField,
} from "react-admin";
import Title from "../shared/Title";

export const VideoGameShow = (props) => (
  <Show {...props} title={<Title base="Video Game" />}>
    <SimpleShowLayout>
      <TextField source="title" />
      <ArrayField source="platforms">
        <SingleFieldList>
          <ChipField source="name" />
        </SingleFieldList>
      </ArrayField>
      <ChipField source="shelf.name" label="Shelf" />
      <NumberField source="rating" />
      <DateField source="updatedAt" />
      <DateField source="createdAt" />
    </SimpleShowLayout>
  </Show>
);

export const VideoGameList = (props) => (
  <List {...props}>
    <Datagrid rowClick="show">
      <TextField source="title" />
      <ArrayField source="platforms">
        <SingleFieldList>
          <ChipField source="name" />
        </SingleFieldList>
      </ArrayField>
      <ChipField source="shelf.name" label="Shelf" />
      <NumberField source="rating" />
      <DateField source="updatedAt" />
      <DateField source="createdAt" />
    </Datagrid>
  </List>
);
