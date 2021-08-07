import { ApolloClient, InMemoryCache, HttpLink, gql } from "@apollo/client";
import fetch from "cross-fetch";
import { Importer, ImportItem, Source } from ".";

const apiClient = new ApolloClient({
  cache: new InMemoryCache(),
  link: new HttpLink({
    uri: "https://api.mattb.tech/",
    fetch,
  }),
});

const billioClient = new ApolloClient({
  cache: new InMemoryCache(),
  link: new HttpLink({
    uri: "http://localhost:4000",
    fetch,
  }),
});

export const source: Source = {
  async fetch(): Promise<ImportItem[]> {
    const apiResult = await apiClient.query({
      query: gql`
        {
          books: recentGoodreadsBooks(first: 200) {
            items {
              googleBooksId
              title
              rating
              read
              started_at
              read_at
            }
          }
        }
      `,
    });
    return apiResult.data.books.items
      .map(
        ({
          googleBooksId,
          title,
          rating,
          read,
          started_at,
          read_at,
        }: any): ImportItem | null => {
          if (!googleBooksId) {
            console.error(`No googleBooksId for "${title}"`);
            return null;
          }
          return {
            id: `googlebooks:${googleBooksId}`,
            title,
            shelf: read ? "Read" : "Reading",
            notes: "Imported from Goodreads.",
            addedAt: `${started_at}T00:00:00Z`,
            movedAt: `${read_at ?? started_at}T00:00:00Z`,
            rating: rating ? rating * 2 : null,
          };
        }
      )
      .filter((i: ImportItem | null) => i);
  },
};

export const importer: Importer = {
  async importItem(item: ImportItem) {
    const { id, shelf, title, ...overrides } = item;
    try {
      const { data } = await billioClient.mutate({
        mutation: gql`
          mutation BulkImportBook(
            $id: ID!
            $shelf: BookShelfId!
            $overrides: OverrideBookInput!
          ) {
            importExternalBook(
              id: $id
              shelfId: $shelf
              overrides: $overrides
            ) {
              id
            }
          }
        `,
        variables: {
          id: item.id,
          shelf: item.shelf,
          overrides,
        },
      });
      console.log(`Imported ${item.title} as ${data.importExternalBook.id}`);
    } catch (e) {
      console.log(JSON.stringify(e, null, 2));
    }
  },
};
