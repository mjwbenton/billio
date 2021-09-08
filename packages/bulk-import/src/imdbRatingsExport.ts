import { gql } from "@apollo/client";
import { Importer, ImportItem, Source } from ".";
import billioClient from "./billioClient";
import neatCsv from "neat-csv";
import { readFile } from "fs/promises";

const TITLE_TYPE = "Title Type";
const RATING = "Your Rating";
const ID = "Const";
const TITLE = "Title";
const DATE = "Date Rated";

const IMPORT_TITLE_TYPES = ["movie", "tvSpecial", "short", "tvMovie"];

export const source: Source = {
  async fetch(): Promise<ImportItem[]> {
    const rawData = await readFile("imdb-ratings.csv");
    const data = await neatCsv(rawData);
    return data
      .map((entry) => {
        const titleType = entry[TITLE_TYPE];
        const rating: number = parseInt(entry[RATING]);
        const id = `imdb:${entry[ID]}`;
        const title = entry[TITLE];
        const date = `${entry[DATE]}T00:00:00Z`;
        if (titleType !== "movie") {
          console.log(`Dropping ${titleType} "${title}" (${id})`);
          return null;
        }
        return {
          id,
          rating,
          title,
          shelf: "Watched",
          addedAt: date,
          movedAt: date,
          notes: "Imported from IMDb.",
        };
      })
      .filter((i) => i) as ImportItem[];
  },
};

export const importer: Importer = {
  async importItem(item: ImportItem) {
    const { id, shelf, title, ...overrides } = item;
    try {
      const { data } = await billioClient.mutate({
        mutation: gql`
          mutation BulkImportMovie(
            $id: ID!
            $shelf: MovieShelfId!
            $overrides: UpdateMovieInput!
          ) {
            importExternalMovie(
              externalId: $id
              shelfId: $shelf
              overrides: $overrides
            ) {
              id
            }
          }
        `,
        variables: {
          id,
          shelf,
          overrides,
        },
      });
      console.log(`Imported ${item.title} as ${data.importExternalMovie.id}`);
    } catch (e) {
      console.log(`Failed importing ${title} with id ${id}`);
      console.log(JSON.stringify(e, null, 2));
    }
  },
};
