import {
  Admin,
  Resource,
  ListGuesser,
  ShowGuesser,
  EditGuesser,
  DataProvider,
} from "react-admin";
import dataProvider from "./dataProvider";
import GamesIcon from "@material-ui/icons/Games";
import BookIcon from "@material-ui/icons/Book";

function App() {
  return (
    <Admin dataProvider={dataProvider as DataProvider}>
      <Resource
        name="VideoGame"
        list={ListGuesser}
        show={ShowGuesser}
        edit={EditGuesser}
        options={{ label: "Video Games" }}
        icon={GamesIcon}
      />
      <Resource
        name="Book"
        list={ListGuesser}
        show={ShowGuesser}
        edit={EditGuesser}
        options={{ label: "Books" }}
        icon={BookIcon}
      />
    </Admin>
  );
}

export default App;
