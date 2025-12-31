import gql from "graphql-tag";
import {
  AddBookInput,
  Book,
  BookShelfId,
  UpdateBookInput,
} from "../generated/graphql";
import resolveAddItem from "../resolvers/resolveAddItem";
import resolveDeleteItem from "../resolvers/resolveDeleteItem";
import resolveExternal from "../resolvers/resolveExternal";
import resolveForId from "../resolvers/resolveForId";
import resolveForType from "../resolvers/resolveForType";
import resolveImportExternal from "../resolvers/resolveImportExternal";
import {
  resolveShelfArgs,
  resolveShelfParent,
} from "../resolvers/resolveShelf";
import resolveShelfItems from "../resolvers/resolveShelfItems";
import resolveUpdateItem from "../resolvers/resolveUpdateItem";
import resolveImportedItem from "../resolvers/resolveImportedItem";
import { GoogleBooksApi } from "./GoogleBooksApi";
import {
  ExternalToInputTransform,
  AddInputTransform,
  OutputTransform,
  UpdateInputTransform,
} from "../shared/transforms";
import { ExternalBook } from "./types";
import { PartialResolvers } from "../shared/types";
import GqlModule from "../shared/gqlModule";
import resolveReference from "../resolvers/resolveReference";

const typeDefs = gql`
  extend type Query {
    book(id: ID!): Book
    bookShelf(id: BookShelfId!): BookShelf
    books(
      after: ID
      first: Int!
      searchTerm: String
      startDate: DateTime
      endDate: DateTime
      sortBy: SortBy
      rating: RatingFilter
    ): BookPage!
    searchExternalBook(term: String!): [ExternalBook!]!
  }

  type Book implements Item @key(fields: "id") {
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
    reread: Boolean!
  }

  type BookShelf {
    id: BookShelfId!
    name: String!
    items(
      after: ID
      first: Int!
      startDate: DateTime
      endDate: DateTime
      sortBy: SortBy
      rating: RatingFilter
    ): BookPage!
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
    importedItem: Book
  }
`;

const mutationTypeDefs = gql`
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
    author: String!
    rating: Rating
    imageUrl: String
    addedAt: DateTime
    movedAt: DateTime
    notes: String
    externalId: String
    reread: Boolean
  }

  input UpdateBookInput {
    title: String
    shelfId: BookShelfId
    rating: Rating
    imageUrl: String
    author: String
    addedAt: DateTime
    movedAt: DateTime
    notes: String
    externalId: String
    reread: Boolean
  }
`;

const TYPE = "Book";

const SHELF_NAMES: { [key in BookShelfId]: string } = {
  Reading: "Reading",
  Read: "Read",
  DidNotFinish: "Did Not Finish",
};

const ADD_INPUT_TRANSFORM: AddInputTransform<AddBookInput, BookShelfId> = (
  input,
) => ({
  author: input.author,
  reread: input.reread,
});

const UPDATE_INPUT_TRANSFORM: UpdateInputTransform<
  UpdateBookInput,
  BookShelfId
> = (input) => ({
  ...(input.author != null ? { author: input.author } : {}),
  ...(input.reread != null ? { reread: input.reread } : {}),
});

const OUTPUT_TRANSFORM: OutputTransform<Book, BookShelfId> = (data) => ({
  author: data.author,
  reread: data.reread ?? false,
});

const EXTERNAL_TRANSFORM: ExternalToInputTransform<
  ExternalBook,
  AddBookInput,
  BookShelfId
> = (external) => ({
  author: external.author,
  reread: false,
});

const GOOGLEBOOKS_API = new GoogleBooksApi();

const resolvers: PartialResolvers = {
  Query: {
    book: resolveForId<Book, BookShelfId>(TYPE, OUTPUT_TRANSFORM),
    books: resolveForType<Book, BookShelfId>(TYPE, OUTPUT_TRANSFORM),
    bookShelf: resolveShelfArgs<BookShelfId>(SHELF_NAMES),
    searchExternalBook: resolveExternal<ExternalBook>(GOOGLEBOOKS_API),
  },
  Book: {
    shelf: resolveShelfParent<BookShelfId>(SHELF_NAMES),
    __resolveReference: resolveReference<Book, BookShelfId>(
      TYPE,
      OUTPUT_TRANSFORM,
    ),
  },
  BookShelf: {
    items: resolveShelfItems<Book, BookShelfId>(TYPE, OUTPUT_TRANSFORM),
  },
  ExternalBook: {
    importedItem: resolveImportedItem<Book, BookShelfId>(OUTPUT_TRANSFORM),
  },
};

const mutationResolvers: PartialResolvers["Mutation"] = {
  importExternalBook: resolveImportExternal<
    Book,
    BookShelfId,
    AddBookInput,
    ExternalBook
  >(
    TYPE,
    OUTPUT_TRANSFORM,
    ADD_INPUT_TRANSFORM,
    EXTERNAL_TRANSFORM,
    GOOGLEBOOKS_API,
  ),
  addBook: resolveAddItem<Book, BookShelfId, AddBookInput>(
    TYPE,
    ADD_INPUT_TRANSFORM,
    OUTPUT_TRANSFORM,
  ),
  updateBook: resolveUpdateItem<Book, BookShelfId, UpdateBookInput>(
    TYPE,
    UPDATE_INPUT_TRANSFORM,
    OUTPUT_TRANSFORM,
  ),
  deleteBook: resolveDeleteItem(TYPE),
};

export default new GqlModule({
  typeDefs,
  mutationTypeDefs,
  resolvers,
  mutationResolvers,
});
