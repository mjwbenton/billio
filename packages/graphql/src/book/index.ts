import { gql } from "apollo-server-lambda";
import {
  AddBookInput,
  Book,
  BookShelfId,
  ExternalBook,
  Resolvers,
  UpdateBookInput,
} from "../generated/graphql";
import { Item as DataItem } from "@mattb.tech/billio-data";
import resolveAddItem from "../resolvers/resolveAddItem";
import resolveDeleteItem from "../resolvers/resolveDeleteItem";
import resolveExternal from "../resolvers/resolveExternal";
import resolveForId from "../resolvers/resolveForId";
import resolveForType from "../resolvers/resolveForType";
import resolveImportExternal from "../resolvers/resolveImportExternal";
import resolveShelf from "../resolvers/resolveShelf";
import resolveShelfItems from "../resolvers/resolveShelfItems";
import resolveShelfName from "../resolvers/resolveShelfName";
import resolveUpdateItem from "../resolvers/resolveUpdateItem";
import { GoogleBooksApi } from "./GoogleBooksApi";
import { FieldTransform } from "../shared/transforms";

export const typeDefs = gql`
  extend type Query {
    book(id: ID!): Book
    bookShelf(id: BookShelfId!): BookShelf
    books(after: ID, first: Int!): BookPage!
    searchExternalBook(term: String!): [ExternalBook!]!
  }

  type Book implements Item {
    id: ID!
    externalId: ID
    addedAt: DateTime!
    movedAt: DateTime!
    notes: String
    title: String!
    rating: Rating
    image: Image
    shelf: BookShelf!
    author: String!
  }

  type BookShelf {
    id: BookShelfId!
    name: String!
    items(after: ID, first: Int!): BookPage!
  }

  enum BookShelfId {
    Reading
    Read
    DidNotFinish
  }

  type BookPage {
    total: Int!
    items: [Book!]!
    hasNextPage: Boolean!
    nextPageCursor: ID
  }

  type ExternalBook {
    id: ID!
    title: String!
    author: String!
    imageUrl: String
  }

  extend type Mutation {
    addBook(item: AddBookInput!): Book!
    updateBook(id: ID!, item: UpdateBookInput!): Book!
    deleteBook(id: ID!): DeleteItemOutput!
    importExternalBook(
      externalId: ID!
      shelfId: BookShelfId!
      overrides: UpdateBookInput
    ): Book!
  }

  input AddBookInput {
    title: String!
    shelfId: BookShelfId!
    rating: Rating
    image: ImageInput
    author: String!
    addedAt: DateTime
    movedAt: DateTime
    notes: String
  }

  input UpdateBookInput {
    title: String
    shelfId: BookShelfId
    rating: Rating
    image: ImageInput
    author: String
    addedAt: DateTime
    movedAt: DateTime
    notes: String
  }
`;

const TYPE = "Book";

const SHELF_NAMES: { [key in BookShelfId]: string } = {
  Reading: "Reading",
  Read: "Read",
  DidNotFinish: "Did Not Finish",
};

const INPUT_TRANSFORM: FieldTransform<
  DataItem,
  AddBookInput | UpdateBookInput
> = () => ({});

const OUTPUT_TRANSFORM: FieldTransform<Book, DataItem> = () => ({});

const EXTERNAL_TRANSFORM: FieldTransform<AddBookInput, ExternalBook> = ({
  imageUrl,
}: any) => ({
  image: imageUrl ? { url: imageUrl, width: null, height: null } : null,
  rating: null,
});

const GOOGLEBOOKS_API = new GoogleBooksApi();

export const resolvers: Resolvers = {
  Query: {
    book: resolveForId<Book>(TYPE, OUTPUT_TRANSFORM),
    books: resolveForType<Book>(TYPE, OUTPUT_TRANSFORM),
    bookShelf: resolveShelf<BookShelfId>(SHELF_NAMES),
    searchExternalBook: resolveExternal<ExternalBook>(GOOGLEBOOKS_API),
  },
  BookShelf: {
    name: resolveShelfName<BookShelfId>(SHELF_NAMES),
    items: resolveShelfItems<Book, BookShelfId>(TYPE, OUTPUT_TRANSFORM),
  },
  Mutation: {
    importExternalBook: resolveImportExternal<
      Book,
      BookShelfId,
      AddBookInput,
      ExternalBook
    >(
      TYPE,
      OUTPUT_TRANSFORM,
      INPUT_TRANSFORM,
      EXTERNAL_TRANSFORM,
      GOOGLEBOOKS_API
    ),
    addBook: resolveAddItem<Book, AddBookInput>(
      TYPE,
      INPUT_TRANSFORM,
      OUTPUT_TRANSFORM
    ),
    updateBook: resolveUpdateItem<Book, UpdateBookInput>(
      TYPE,
      INPUT_TRANSFORM,
      OUTPUT_TRANSFORM
    ),
    deleteBook: resolveDeleteItem(TYPE),
  },
};
