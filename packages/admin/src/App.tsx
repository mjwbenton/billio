import { Admin, Resource, ListGuesser, DataProvider } from "react-admin";
import dataProvider from "./dataProvider";

function App() {
  return (
    <Admin dataProvider={dataProvider as DataProvider}>
      <Resource name="VideoGame" list={ListGuesser} />
      <Resource name="Book" list={ListGuesser} />
    </Admin>
  );
}

export default App;
