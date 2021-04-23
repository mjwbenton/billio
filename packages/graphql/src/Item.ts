import {
  Arg,
  ClassType,
  Field,
  ID,
  InputType,
  Mutation,
  ObjectType,
  Query,
  Resolver,
} from "type-graphql";
import {
  Query as DataQuery,
  Mutate as DataMutate,
  Item as DataItem,
} from "@mattb.tech/billio-data";
import { lowerFirst } from "./util";
import { v4 as uuid } from "uuid";

export default interface Item {
  id: string;
  shelf: { id: string };
  createdAt: Date;
  updatedAt: Date;
  title: string;
}

@ObjectType({ isAbstract: true })
export abstract class AbstractItem {
  @Field((type) => ID)
  id: string;
  @Field()
  createdAt: Date;
  @Field()
  updatedAt: Date;
  @Field()
  title: string;
  // Shelf not included. Gets added by all subclasses to avoid a circular dependency.
}

@InputType({ isAbstract: true })
export abstract class AddItemInput {
  @Field()
  title: string;
  @Field((type) => ID)
  shelfId: string;
}

@InputType({ isAbstract: true })
export abstract class UpdateItemInput {
  @Field((type) => ID)
  id: string;
  @Field({ nullable: true })
  title: string;
  @Field((type) => ID, { nullable: true })
  shelfId: string;
}

@InputType()
export class DeleteItemInput {
  @Field((type) => ID)
  id: string;
}

@ObjectType()
export class DeleteItemOutput {
  @Field((type) => ID)
  id: string;
}

export function ItemResolverFactory<
  TItem extends Item,
  TAddItemInput extends AddItemInput,
  TUpdateItemInput extends UpdateItemInput
>(
  TItem: ClassType<TItem>,
  TAddItemInput: ClassType<TAddItemInput>,
  TUpdateItemInput: ClassType<TUpdateItemInput>
) {
  @Resolver(TItem)
  class ItemResolverImpl {
    @Query((returns) => TItem, { nullable: true, name: lowerFirst(TItem.name) })
    async item(@Arg("id", (type) => ID) id: string): Promise<TItem | null> {
      const data = await DataQuery.withId({ type: TItem.name, id });
      return transformItem<TItem>(data);
    }

    @Mutation((returns) => TItem, { name: `add${TItem.name}` })
    async addItem(
      @Arg("item", (type) => TAddItemInput) item: TAddItemInput
    ): Promise<TItem> {
      const outputItem = await DataMutate.createItem({
        id: uuid(),
        type: TItem.name,
        ...transformAddItemInput(item),
      });
      return transformItem<TItem>(outputItem);
    }

    @Mutation((returns) => TItem, { name: `update${TItem.name}` })
    async updateItem(
      @Arg("item", (type) => TUpdateItemInput) inputItem: TUpdateItemInput
    ) {
      const outputItem = await DataMutate.updateItem({
        type: TItem.name,
        ...transformUpdateItemInput(inputItem),
      });
      return transformItem<TItem>(outputItem);
    }

    @Mutation((returns) => DeleteItemOutput, {
      name: `delete${TItem.name}`,
    })
    async deleteItem(
      @Arg("item", (type) => DeleteItemInput) { id }: DeleteItemInput
    ): Promise<DeleteItemOutput> {
      await DataMutate.deleteItem({ id, type: TItem.name });
      return { id };
    }
  }
  return ItemResolverImpl;
}

export function transformItem<TItem extends Item>(input: DataItem): TItem {
  const { shelf, type, ...rest } = input;
  // Cast to TItem isn't validated here, but will be validated on output by the GraphQL engine
  return {
    ...rest,
    shelf: {
      id: input.shelf,
    },
  } as TItem;
}

function transformAddItemInput<T extends AddItemInput>(input: T) {
  const { shelfId, ...rest } = input;
  return {
    ...rest,
    shelf: shelfId,
  };
}

function transformUpdateItemInput<T extends UpdateItemInput>(input: T) {
  const { shelfId, ...rest } = input;
  return {
    ...rest,
    ...(shelfId ? { shelf: shelfId } : {}),
  };
}
