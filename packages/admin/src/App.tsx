import { Admin, Resource } from "react-admin";
import dataProvider from "./dataProvider";
import authProvider from "./authProvider";
import GamesIcon from "@material-ui/icons/Games";
import BookIcon from "@material-ui/icons/Book";
import { BookCreate, BookEdit } from "./book/BookEdit";
import { VideoGameCreate, VideoGameEdit } from "./videogame/VideoGameEdit";
import { VideoGameShow, VideoGameList } from "./videogame/VideoGameShow";
import { BookShow, BookList } from "./book/BookShow";
import { createMuiTheme } from "@material-ui/core/styles";

const THEME = createMuiTheme({
  palette: {
    primary: {
      main: "#7c3aed",
    },
    secondary: {
      main: "#10b981",
      contrastText: "#fafafa",
    },
    grey: {},
  },
  overrides: {
    MuiFilledInput: {
      root: {
        backgroundColor: "rgba(0,0,0,0.05)",
      },
    },
  },
  typography: {
    fontFamily: [
      "-apple-system",
      "BlinkMacSystemFont",
      '"Segoe UI"',
      "Arial",
      "sans-serif",
    ].join(","),
  },
});

function App() {
  return (
    <Admin
      theme={THEME}
      dataProvider={dataProvider}
      authProvider={authProvider}
    >
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
