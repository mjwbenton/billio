import {
  Arg,
  Field,
  ID,
  InputType,
  Mutation,
  ObjectType,
  Query,
  registerEnumType,
  Resolver,
} from "type-graphql";
import Container from "typedi";
import { ExternalImportResolverFactory } from "./external/ExternalImport";
import { GoogleBooksApi, ExternalBook } from "./external/GoogleBooksApi";
import { AbstractItem, ItemResolverFactory } from "./Item";
import {
  AddItemInput,
  UpdateItemInput,
  ItemMutationResolverFactory,
} from "./ItemMutation";
import { PageResolverFactory, PageTypeFactory } from "./Page";
import { ShelfResolverFactory, ShelfTypeFactory } from "./Shelf";
import { StringKey } from "./util";

export enum BookShelfId {
  Reading = "Reading",
  Read = "Read",
  DidNotFinish = "DidNotFinish",
}
registerEnumType(BookShelfId, { name: "BookShelfId" });

const SHELF_NAMES = {
  Reading: "Reading",
  Read: "Read",
  DidNotFinish: "Did Not Finish",
};

@ObjectType()
export class Book extends AbstractItem {
  @Field((type) => Shelf)
  shelf: { id: BookShelfId };
  @Field()
  author: string;
}

const Page = PageTypeFactory(() => Book);
const Shelf = ShelfTypeFactory(
  () => Book,
  () => Page,
  () => BookShelfId
);

@InputType()
class AddBookInput extends AddItemInput {
  @Field((type) => BookShelfId)
  shelfId: StringKey<typeof BookShelfId>;
  @Field()
  author: string;
}

@InputType()
class UpdateBookInput extends UpdateItemInput {
  @Field((type) => BookShelfId, { nullable: true })
  shelfId: StringKey<typeof BookShelfId>;
  @Field({ nullable: true })
  author: string;
}

const ItemResolver = ItemResolverFactory(Book);
const ItemMutationResolver = ItemMutationResolverFactory(
  Book,
  AddBookInput,
  UpdateBookInput
);
const ShelfResolver = ShelfResolverFactory(
  Book,
  Shelf,
  BookShelfId,
  SHELF_NAMES
);
const PageResolver = PageResolverFactory(Book, Page);

const ExternalImportResolver = ExternalImportResolverFactory(
  ExternalBook,
  Book,
  BookShelfId,
  AddBookInput,
  Container.get(GoogleBooksApi),
  Container.get(ItemMutationResolver),
  (input: ExternalBook, shelfId: StringKey<typeof BookShelfId>) => {
    return {
      title: input.title,
      author: input.author,
      shelfId,
      rating: null,
      image: input.imageUrl
        ? {
            url: input.imageUrl,
            width: null,
            height: null,
          }
        : null,
    };
  }
);

export const queryResolvers = [
  ItemResolver,
  ShelfResolver,
  PageResolver,
] as const;

export const mutationResolvers = [
  ItemMutationResolver,
  ExternalImportResolver,
] as const;
