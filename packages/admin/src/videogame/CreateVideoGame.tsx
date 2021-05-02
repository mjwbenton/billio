import { Create, SimpleForm, TextInput } from "react-admin";
import RatingInput from "../shared/RatingInput";
import ShelfInput from "../shared/ShelfInput";
import PlatformsInput from "./PlatformsInput";
import shelves from "./shelves";

const CreateVideoGame = (props) => (
  <Create {...props}>
    <SimpleForm>
      <TextInput source="title" />
      <PlatformsInput />
      <ShelfInput shelves={shelves} />
      <RatingInput />
    </SimpleForm>
  </Create>
);

export default CreateVideoGame;
