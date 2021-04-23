import {
  Admin,
  Resource,
  ListGuesser,
  ShowGuesser,
  EditGuesser,
  DataProvider,
} from "react-admin";
import dataProviderPromise from "./dataProvider";
import GamesIcon from "@material-ui/icons/Games";
import BookIcon from "@material-ui/icons/Book";
import { useEffect, useState } from "react";
import CreateBook from "./book/CreateBook";
import CreateVideoGame from "./videogame/CreateVideoGame";
import { AuthProvider, Login } from "ra-cognito";

function App() {
  const [dataProvider, setDataProvider] = useState<DataProvider | null>(null);

  useEffect(() => {
    dataProviderPromise.then((dataProvider: DataProvider) =>
      setDataProvider(() => dataProvider)
    );
  });

  if (!dataProvider) {
    return <p>Loading...</p>;
  }

  return (
    <Admin dataProvider={dataProvider} authProvider={AuthProvider}>
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
