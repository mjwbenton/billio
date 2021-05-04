import { Admin, Resource, ListGuesser, EditGuesser } from "react-admin";
import dataProvider from "./dataProvider";
import authProvider from "./authProvider";
import GamesIcon from "@material-ui/icons/Games";
import BookIcon from "@material-ui/icons/Book";
import { BookCreate, BookEdit } from "./book/BookEdit";
import { VideoGameCreate, VideoGameEdit } from "./videogame/VideoGameEdit";
import { VideoGameShow, VideoGameList } from "./videogame/VideoGameShow";
import { BookShow, BookList } from "./book/BookShow";

function App() {
  return (
    <Admin dataProvider={dataProvider} authProvider={authProvider}>
      <Resource
        name="VideoGame"
        create={VideoGameCreate}
        list={VideoGameList}
        show={VideoGameShow}
        edit={VideoGameEdit}
        options={{ label: "Video Games" }}
        icon={GamesIcon}
      />
      <Resource
        name="Book"
        create={BookCreate}
        list={BookList}
        show={BookShow}
        edit={BookEdit}
        options={{ label: "Books" }}
        icon={BookIcon}
      />
    </Admin>
  );
}

export default App;
