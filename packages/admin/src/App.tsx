import { Admin, Resource, ResourceContextProvider } from "react-admin";
import dataProvider from "./dataProvider";
import authProvider from "./authProvider";
import GamesIcon from "@material-ui/icons/Games";
import BookIcon from "@material-ui/icons/Book";
import { BookCreate, BookEdit } from "./book/BookEdit";
import { VideoGameCreate, VideoGameEdit } from "./videogame/VideoGameEdit";
import { VideoGameShow, VideoGameList } from "./videogame/VideoGameShow";
import { BookShow, BookList } from "./book/BookShow";
import { createMuiTheme } from "@material-ui/core/styles";
import { Route } from "react-router-dom";
import ImportPage from "./import/ImportPage";
import VideoGameImport from "./videogame/VideoGameImport";
import BookImport from "./book/BookImport";

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

const CUSTOM_ROUTES = [
  <Route
    exact
    path="/VideoGame/import"
    component={(renderProps) => (
      <ResourceContextProvider value="VideoGame">
        <ImportPage>
          <VideoGameImport />
        </ImportPage>
      </ResourceContextProvider>
    )}
  />,
  <Route
    exact
    path="/Book/import"
    component={(renderProps) => (
      <ResourceContextProvider value="Book">
        <ImportPage>
          <BookImport />
        </ImportPage>
      </ResourceContextProvider>
    )}
  />,
];

function App() {
  return (
    <Admin
      title="Billio"
      theme={THEME}
      dataProvider={dataProvider}
      authProvider={authProvider}
      customRoutes={CUSTOM_ROUTES}
      disableTelemetry
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
