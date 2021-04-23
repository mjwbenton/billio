import { Create, SimpleForm, TextInput } from "react-admin";

const CreateBook = (props) => (
  <Create {...props}>
    <SimpleForm>
      <TextInput source="title" />
      <TextInput source="author" />
      <TextInput source="shelf.id" />
    </SimpleForm>
  </Create>
);

export default CreateBook;
