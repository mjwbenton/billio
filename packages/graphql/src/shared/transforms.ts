import {
  Item as DataItem,
  CreateItem as DataCreateItem,
  UpdateItem as DataUpdateItem,
} from "@mattb.tech/billio-data";
import { Item, ItemInput, ItemOverrides } from "./Item";
import { storeImage, selectImage } from "./Image";
import { Unresolved } from "./types";
import { ExternalItem } from "../external/ExternalApi";
import deleteNullOrUndefined from "./deleteNullOrUndefined";

const IMAGE_DOMAIN = process.env.BILLIO_IMAGE_DOMAIN!;

export type OutputTransform<
  TItem extends Item<TShelfId>,
  TShelfId extends string,
> = (
  data: DataItem,
) => Omit<Unresolved<TItem>, keyof Unresolved<Item<TShelfId>>>;

export function transformItem<
  TItem extends Item<TShelfId>,
  TShelfId extends string,
>(
  input: DataItem,
  fieldTransform: OutputTransform<TItem, TShelfId>,
): Omit<Unresolved<TItem>, keyof Unresolved<Item<TShelfId>>> &
  Unresolved<Item<TShelfId>> {
  const { image } = input;
  const transformed = fieldTransform(input);
  const selectedImage = selectImage(image);
  // Cast to assume that the shelf stored on DataItem is valid
  const shelfId: TShelfId = input.shelf as TShelfId;
  const base: Unresolved<Item<TShelfId>> = {
    id: input.id,
    addedAt: input.addedAt,
    movedAt: input.movedAt,
    title: input.title ?? "",
    notes: input.notes ?? null,
    externalId: input.externalId ?? null,
    rating: input.rating ?? null,
    image: selectedImage
      ? {
          ...selectedImage,
          url: `${IMAGE_DOMAIN}/${selectedImage.url}`,
        }
      : null,
    shelfId,
  };
  return {
    ...base,
    ...transformed,
  };
}
export type ExternalToInputTransform<
  TExternalItem extends ExternalItem,
  TItemInput extends ItemInput<TShelfId>,
  TShelfId extends string,
> = (item: TExternalItem) => Omit<TItemInput, keyof ItemInput<TShelfId>>;

export function transformExternalItem<
  TExternalItem extends ExternalItem,
  TItemInput extends ItemInput<TShelfId>,
  TShelfId extends string,
>(
  input: TExternalItem,
  shelfId: TShelfId,
  transform: ExternalToInputTransform<TExternalItem, TItemInput, TShelfId>,
): Omit<TItemInput, keyof ItemInput<TShelfId>> & ItemInput<TShelfId> {
  const transformed = transform(input);
  const base: ItemInput<TShelfId> = {
    title: input.title,
    imageUrl: input.imageUrl ?? null,
    externalId: input.id,
    shelfId,
  };
  return {
    ...base,
    ...transformed,
  };
}

export type AddInputTransform<
  TItemInput extends ItemInput<TShelfId>,
  TShelfId extends string,
> = (
  input: Omit<TItemInput, keyof ItemInput<TShelfId>> & ItemInput<TShelfId>,
) => {
  [additional: string]: any;
};

export async function transformAddItemInput<
  TItemInput extends ItemInput<TShelfId>,
  TShelfId extends string,
>(
  id: string,
  type: string,
  input: Omit<TItemInput, keyof ItemInput<TShelfId>> & ItemInput<TShelfId>,
  fieldTransform: AddInputTransform<TItemInput, TShelfId>,
): Promise<DataCreateItem> {
  const {
    shelfId: shelf,
    imageUrl,
    movedAt,
    addedAt,
    title,
    rating,
    notes,
    externalId,
  } = input;
  const transformed = fieldTransform(input);
  return {
    ...transformed,
    id,
    type,
    shelf,
    title,
    ...(imageUrl
      ? {
          image: await storeImage({ imageUrl }),
        }
      : {}),
    ...deleteNullOrUndefined({
      movedAt,
      addedAt,
      rating,
      notes,
      externalId,
    }),
  };
}

export type UpdateInputTransform<
  TItemInput extends ItemOverrides<ItemInput<TShelfId>>,
  TShelfId extends string,
> = (
  input: Omit<TItemInput, keyof ItemInput<TShelfId>> &
    ItemOverrides<ItemInput<TShelfId>>,
) => {
  [additional: string]: any;
};

export async function transformUpdateItemInput<
  TItemInput extends ItemOverrides<ItemInput<TShelfId>>,
  TShelfId extends string,
>(
  id: string,
  type: string,
  input: TItemInput,
  fieldTransform: UpdateInputTransform<TItemInput, TShelfId>,
): Promise<DataUpdateItem> {
  const {
    shelfId: shelf,
    imageUrl,
    movedAt,
    addedAt,
    title,
    rating,
    notes,
    externalId,
  } = input;
  const transformed = fieldTransform(input);
  return {
    ...transformed,
    id,
    type,
    ...(imageUrl
      ? {
          image: await storeImage({ imageUrl }),
        }
      : {}),
    ...deleteNullOrUndefined({
      shelf,
      title,
      movedAt,
      addedAt,
      rating,
      notes,
      externalId,
    }),
  };
}
