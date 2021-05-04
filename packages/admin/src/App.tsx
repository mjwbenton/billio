import { Admin, Resource, ListGuesser, EditGuesser } from "react-admin";
import dataProvider from "./dataProvider";
import authProvider from "./authProvider";
import GamesIcon from "@material-ui/icons/Games";
import BookIcon from "@material-ui/icons/Book";
import CreateBook from "./book/CreateBook";
import CreateVideoGame from "./videogame/CreateVideoGame";
import VideoGameShow from "./videogame/VideoGameShow";
import BookShow from "./book/BookShow";

function App() {
  return (
    <Admin dataProvider={dataProvider} authProvider={authProvider}>
      <Resource
        name="VideoGame"
        create={CreateVideoGame}
        list={ListGuesser}
        show={VideoGameShow}
        edit={EditGuesser}
        options={{ label: "Video Games" }}
        icon={GamesIcon}
      />
      <Resource
        name="Book"
        create={CreateBook}
        list={ListGuesser}
        show={BookShow}
        edit={EditGuesser}
        options={{ label: "Books" }}
        icon={BookIcon}
      />
    </Admin>
  );
}

export default App;
