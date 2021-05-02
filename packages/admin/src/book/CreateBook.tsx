import { Create, SimpleForm, TextInput } from "react-admin";
import RatingInput from "../shared/RatingInput";
import ShelfInput from "../shared/ShelfInput";
import shelves from "./shelves";

const CreateBook = (props) => (
  <Create {...props}>
    <SimpleForm>
      <TextInput source="title" />
      <TextInput source="author" />
      <ShelfInput shelves={shelves} />
      <RatingInput />
    </SimpleForm>
  </Create>
);

export default CreateBook;
