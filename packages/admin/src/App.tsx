import { Admin, Resource, ResourceContextProvider } from "react-admin";
import dataProvider from "./dataProvider";
import authProvider from "./authProvider";
import GamesIcon from "@material-ui/icons/Games";
import BookIcon from "@material-ui/icons/Book";
import MovieIcon from "@material-ui/icons/Movie";
import TvIcon from "@material-ui/icons/Tv";
import {
  VideoGameCreate,
  VideoGameEdit,
  VideoGameImport,
} from "./videogame/VideoGameEdit";
import { VideoGameShow, VideoGameList } from "./videogame/VideoGameShow";
import { BookCreate, BookEdit, BookImport } from "./book/BookEdit";
import { BookShow, BookList } from "./book/BookShow";
import { MovieCreate, MovieEdit, MovieImport } from "./movie/MovieEdit";
import { MovieShow, MovieList } from "./movie/MovieShow";
import { createMuiTheme } from "@material-ui/core/styles";
import { Route } from "react-router-dom";
import ImportPage from "./import/ImportPage";
import {
  TvSeasonCreate,
  TvSeasonEdit,
  TvSeasonImport,
} from "./tv/TvSeasonEdit";
import { TvSeasonShow, TvSeasonList } from "./tv/TvSeasonShow";
import {
  TvSeriesCreate,
  TvSeriesEdit,
  TvSeriesImport,
} from "./tv/TvSeriesEdit";
import { TvSeriesList, TvSeriesShow } from "./tv/TvSeriesShow";

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
  <Route
    exact
    path="/Movie/import"
    component={(renderProps) => (
      <ResourceContextProvider value="Movie">
        <ImportPage>
          <MovieImport />
        </ImportPage>
      </ResourceContextProvider>
    )}
  />,
  <Route
    exact
    path="/TvSeries/import"
    component={(renderProps) => (
      <ResourceContextProvider value="TvSeries">
        <ImportPage>
          <TvSeriesImport />
        </ImportPage>
      </ResourceContextProvider>
    )}
  />,
  <Route
    exact
    path="/TvSeason/import"
    component={(renderProps) => (
      <ResourceContextProvider value="TvSeason">
        <ImportPage>
          <TvSeasonImport />
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
      <Resource
        name="Movie"
        create={MovieCreate}
        list={MovieList}
        show={MovieShow}
        edit={MovieEdit}
        options={{ label: "Movies" }}
        icon={MovieIcon}
      />
      <Resource
        name="TvSeries"
        create={TvSeriesCreate}
        list={TvSeriesList}
        show={TvSeriesShow}
        edit={TvSeriesEdit}
        options={{ label: "TV Series" }}
        icon={TvIcon}
      />
      <Resource
        name="TvSeason"
        create={TvSeasonCreate}
        list={TvSeasonList}
        show={TvSeasonShow}
        edit={TvSeasonEdit}
        options={{ label: "TV Seasons" }}
        icon={TvIcon}
      />
    </Admin>
  );
}

export default App;
