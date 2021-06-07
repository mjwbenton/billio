import { SimpleForm } from "react-admin";
import Import from "../import/Import";
import SearchExternalInput from "../import/SearchExternalInput";
import ShelfInput from "../shared/ShelfInput";
import SHELVES from "./VideoGameShelves";

const VideoGameImport = () => (
  <Import>
    <SimpleForm>
      <SearchExternalInput source="id" />
      <ShelfInput shelves={SHELVES} />
    </SimpleForm>
  </Import>
);

export default VideoGameImport;
