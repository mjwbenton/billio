import { Item as DataItem } from "@mattb.tech/billio-data";
import Item from "./Item";
import { AddItemInput, UpdateItemInput } from "./ItemMutation";

export type FieldTransform<OutType, InType = any> = (
  given: InType
) => Partial<OutType>;

export function transformItem<TItem extends Item>(
  input: DataItem,
  fieldTransform: FieldTransform<TItem> = () => ({})
): TItem {
  const { shelf, type, ...rest } = input;
  const transformed = fieldTransform(input);
  // Cast to TItem isn't validated here, but will be validated on output by the GraphQL engine
  return {
    ...rest,
    ...transformed,
    shelf: {
      id: input.shelf,
    },
  } as TItem;
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
