import { Field, InputType, ObjectType, registerEnumType } from "type-graphql";
import {
  AbstractItem,
  AddItemInput,
  ItemResolverFactory,
  UpdateItemInput,
} from "./Item";
import { PageResolverFactory, PageTypeFactory } from "./Page";
import { ShelfResolverFactory, ShelfTypeFactory } from "./Shelf";

enum ShelfId {
  Reading = "Reading",
  Read = "Read",
  DidNotFinish = "Did Not Finish",
}
registerEnumType(ShelfId, { name: "BookShelfId" });

@ObjectType()
class Book extends AbstractItem {
  @Field((type) => Shelf)
  shelf: { id: ShelfId };
  @Field()
  author: string;
}

const Page = PageTypeFactory(() => Book);
const Shelf = ShelfTypeFactory(
  () => Book,
  () => Page,
  () => ShelfId
);

@InputType()
class AddBookInput extends AddItemInput {
  @Field((type) => ShelfId)
  shelfId: ShelfId;
  @Field()
  author: string;
}

@InputType()
class UpdateBookInput extends UpdateItemInput {
  @Field((type) => ShelfId, { nullable: true })
  shelfId: ShelfId;
  @Field({ nullable: true })
  author: string;
}

const ItemResolver = ItemResolverFactory(Book, AddBookInput, UpdateBookInput);
const ShelfResolver = ShelfResolverFactory(Book, Shelf, ShelfId);
const PageResolver = PageResolverFactory(Book, Page);

export const resolvers = [ItemResolver, ShelfResolver, PageResolver] as const;
