import { SimpleForm, TextInput } from "react-admin";
import Import from "../import/Import";
import ShelfInput from "../shared/ShelfInput";
import SHELVES from "./VideoGameShelves";

const VideoGameImport = (props) => (
  <Import>
    <SimpleForm>
      <TextInput source="id" />
      <ShelfInput shelves={SHELVES} />
    </SimpleForm>
  </Import>
);

export default VideoGameImport;
