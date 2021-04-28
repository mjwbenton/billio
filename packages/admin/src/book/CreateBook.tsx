import { Create, NumberInput, SimpleForm, TextInput } from "react-admin";

const CreateBook = (props) => (
  <Create {...props}>
    <SimpleForm>
      <TextInput source="title" />
      <TextInput source="author" />
      <TextInput source="shelf.id" />
      <NumberInput source="rating" />
    </SimpleForm>
  </Create>
);

export default CreateBook;
