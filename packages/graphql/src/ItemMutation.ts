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
import Image from "./shared/Image";
import Item from "./shared/Item";
import { FieldTransform, transformItem } from "./transforms";
import Rating from "./shared/Rating";
import { Mutate as DataMutate } from "@mattb.tech/billio-data";

@InputType({ isAbstract: true })
export abstract class AddItemInput {
  @Field()
  title: string;
  @Field((type) => ID)
  shelfId: string;
  @Field((type) => Rating, { nullable: true })
  rating?: number | null;
  @Field((type) => Image, { nullable: true })
  image?: Image | null;
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

export interface ItemMutationResolver<
  TItem extends Item,
  TAddItemInput extends AddItemInput,
  TUpdateItemInput extends UpdateItemInput
> {
  addItem(item: TAddItemInput): Promise<TItem>;
  updateItem(item: TUpdateItemInput): Promise<TItem>;
  deleteItem(input: DeleteItemInput): Promise<DeleteItemOutput>;
}

export function ItemMutationResolverFactory<
  TItem extends Item,
  TAddItemInput extends AddItemInput,
  TUpdateItemInput extends UpdateItemInput
>(
  TItem: ClassType<TItem>,
  TAddItemInput: ClassType<TAddItemInput>,
  TUpdateItemInput: ClassType<TUpdateItemInput>,
  outputTransform?: FieldTransform<TItem>,
  inputTransform?: FieldTransform<any, TAddItemInput | TUpdateItemInput>
) {
  @Resolver(TItem)
  class ItemMutationResolverImpl
    implements ItemMutationResolver<TItem, TAddItemInput, TUpdateItemInput>
  {
    @Mutation((returns) => TItem, { name: `add${TItem.name}` })
    async addItem(
      @Arg("item", (type) => TAddItemInput) item: TAddItemInput
    ): Promise<TItem> {
      const outputItem = await DataMutate.createItem({
        id: uuid(),
        type: TItem.name,
        ...transformAddItemInput(item, inputTransform),
      });
      return transformItem<TItem>(outputItem, outputTransform);
    }

    @Mutation((returns) => TItem, { name: `update${TItem.name}` })
    async updateItem(
      @Arg("item", (type) => TUpdateItemInput) inputItem: TUpdateItemInput
    ): Promise<TItem> {
      const outputItem = await DataMutate.updateItem({
        type: TItem.name,
        ...transformUpdateItemInput(inputItem, inputTransform),
      });
      return transformItem<TItem>(outputItem, outputTransform);
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
  return ItemMutationResolverImpl;
}

export function transformAddItemInput<T extends AddItemInput>(
  input: T,
  fieldTransform: FieldTransform<any, T> = () => ({})
) {
  const { shelfId, ...rest } = input;
  const transformed = fieldTransform(input);
  return {
    ...rest,
    ...transformed,
    shelf: shelfId,
  };
}

export function transformUpdateItemInput<T extends UpdateItemInput>(
  input: T,
  fieldTransform: FieldTransform<any, T> = () => ({})
) {
  const { shelfId, ...rest } = input;
  const transformed = fieldTransform(input);
  return {
    ...rest,
    ...transformed,
    ...(shelfId ? { shelf: shelfId } : {}),
  };
}
