import {
  ArrayInput,
  Create,
  SimpleForm,
  SimpleFormIterator,
  TextInput,
} from "react-admin";

const CreateVideoGame = (props) => (
  <Create {...props}>
    <SimpleForm>
      <TextInput source="id" />
      <TextInput source="title" />
      <ArrayInput source="platforms">
        <SimpleFormIterator>
          <TextInput source="" />
        </SimpleFormIterator>
      </ArrayInput>

      <TextInput source="shelf.id" />
    </SimpleForm>
  </Create>
);

export default CreateVideoGame;
