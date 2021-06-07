import { SimpleForm } from "react-admin";
import Import from "../import/Import";
import SearchExternalInput from "../import/SearchExternalInput";
import ShelfInput from "../shared/ShelfInput";
import SHELVES from "./BookShelves";

const BookImport = () => (
  <Import>
    <SimpleForm>
      <SearchExternalInput source="id" />
      <ShelfInput shelves={SHELVES} />
    </SimpleForm>
  </Import>
);

export default BookImport;
