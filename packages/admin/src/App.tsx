import {
  Admin,
  Resource,
  ListGuesser,
  ShowGuesser,
  EditGuesser,
} from "react-admin";
import dataProvider from "./dataProvider";
import authProvider from "./authProvider";
import GamesIcon from "@material-ui/icons/Games";
import BookIcon from "@material-ui/icons/Book";
import CreateBook from "./book/CreateBook";
import CreateVideoGame from "./videogame/CreateVideoGame";

function App() {
  return (
    <Admin dataProvider={dataProvider} authProvider={authProvider}>
      <Resource
        name="VideoGame"
        create={CreateVideoGame}
        list={ListGuesser}
        show={ShowGuesser}
        edit={EditGuesser}
        options={{ label: "Video Games" }}
        icon={GamesIcon}
      />
      <Resource
        name="Book"
        create={CreateBook}
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
