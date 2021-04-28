import {
  Arg,
  ClassType,
  Field,
  ID,
  InputType,
  Mutation,
  ObjectType,
  Resolver,
} from "type-graphql";
import { v4 as uuid } from "uuid";
import Image from "./Image";
import Item, { transformItem } from "./Item";
import Rating from "./Rating";
import { Mutate as DataMutate } from "@mattb.tech/billio-data";

@InputType({ isAbstract: true })
export abstract class AddItemInput {
  @Field()
  title: string;
  @Field((type) => ID)
  shelfId: string;
  @Field((type) => Rating, { nullable: true })
  rating: number | null;
  @Field((type) => Image, { nullable: true })
  image: Image | null;
}

@InputType({ isAbstract: true })
export abstract class UpdateItemInput {
  @Field((type) => ID)
  id: string;
  @Field((type) => String, { nullable: true })
  title: string | null;
  @Field((type) => ID, { nullable: true })
  shelfId: string | null;
  @Field((type) => Rating, { nullable: true })
  rating: number | null;
  @Field((type) => Image, { nullable: true })
  image: Image | null;
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

export function ItemMutationResolverFactory<
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
