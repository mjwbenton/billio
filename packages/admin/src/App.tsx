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
    <Admin dataProvider={dataProvider}>
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
