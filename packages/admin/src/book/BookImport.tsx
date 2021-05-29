import { SimpleForm, TextInput } from "react-admin";
import Import from "../import/Import";
import ShelfInput from "../shared/ShelfInput";
import SHELVES from "./BookShelves";

const BookImport = (props) => (
  <Import>
    <SimpleForm>
      <TextInput source="id" />
      <ShelfInput shelves={SHELVES} />
    </SimpleForm>
  </Import>
);

export default BookImport;
