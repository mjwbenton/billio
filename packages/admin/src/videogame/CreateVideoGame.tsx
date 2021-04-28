import {
  ArrayInput,
  Create,
  SimpleForm,
  SimpleFormIterator,
  TextInput,
  NumberInput,
} from "react-admin";

const CreateVideoGame = (props) => (
  <Create {...props}>
    <SimpleForm>
      <TextInput source="title" />
      <ArrayInput source="platforms">
        <SimpleFormIterator>
          <TextInput source="" />
        </SimpleFormIterator>
      </ArrayInput>
      <TextInput source="shelf.id" />
      <NumberInput source="rating" />
    </SimpleForm>
  </Create>
);

export default CreateVideoGame;
