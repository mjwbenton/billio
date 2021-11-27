import { ApolloClient, InMemoryCache, HttpLink, gql } from "@apollo/client";
import fetch from "cross-fetch";
import { Importer, ImportItem, Source } from ".";
import billioClient from "./billioClient";

const apiClient = new ApolloClient({
  cache: new InMemoryCache(),
  link: new HttpLink({
    uri: "https://api.mattb.tech/",
    fetch,
  }),
});

const OVERRIDE_GOODREADS_TO_GOOGLEBOOKS: { [key: string]: string } = {
  "14497": "D7UlOLjDl8QC", // Neverwhere
  "89937": "bfBkmwEACAAJ", // Principa Discordia
  "960": "BxpxwgEACAAJ", // Angels and Demons
  "11": "gZU1swEACAAJ", // Hitchikers guide to the galaxy
  "5470": "kotPYEqx7kMC", // 1984
  "285092": "yXbkAF7w4twC", // High fidelity
  "16902": "yoDC8r-lZ68C", // Walden
  "13496": "PNZIdRZ-W28C", // A Game of thrones
  "16081012": "B2Jfqm58x_8C", // Back Story
};

export const source: Source = {
  async fetch(): Promise<ImportItem[]> {
    const apiResult = await apiClient.query({
      query: gql`
        {
          books: recentGoodreadsBooks(first: 200) {
            items {
              goodreadsId: id
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
          goodreadsId,
          googleBooksId,
          title,
          rating,
          read,
          started_at,
          read_at,
        }: any): ImportItem | null => {
          const resolvedId =
            OVERRIDE_GOODREADS_TO_GOOGLEBOOKS[goodreadsId] ?? googleBooksId;
          if (!resolvedId) {
            throw new Error(`No googleBooksId for "${title}" (${goodreadsId})`);
          }
          return {
            id: `googlebooks:${resolvedId}`,
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
            $overrides: UpdateBookInput!
          ) {
            importExternalBook(
              externalId: $id
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
      return {
        success: true,
        externalId: id,
        title,
        id: data.importExternalBook.id,
      };
    } catch (error) {
      return {
        success: false,
        externalId: id,
        title,
        error,
      };
    }
  },
};
