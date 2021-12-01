import { ItemInput, ItemOverrides } from "../shared/Item";
import { Mutate as DataMutate } from "@mattb.tech/billio-data";
import { Item } from "../shared/Item";
import { v4 as uuid } from "uuid";
import {
  ExternalToInputTransform,
  AddInputTransform,
  OutputTransform,
  transformAddItemInput,
  transformExternalItem,
  transformItem,
} from "../shared/transforms";
import { ExternalItem, GetExternalApi } from "../external/ExternalApi";
import deleteNullOrUndefined from "../shared/deleteNullOrUndefined";

export default function resolveImportExternal<
  TItem extends Item<TShelfId>,
  TShelfId extends string,
  TItemInput extends ItemInput<TShelfId>,
  TExternalItem extends ExternalItem
>(
  type: string,
  outputTransform: OutputTransform<TItem, TShelfId>,
  inputTransform: AddInputTransform<TItemInput, TShelfId>,
  externalItemTransform: ExternalToInputTransform<
    TExternalItem,
    TItemInput,
    TShelfId
  >,
  api: GetExternalApi<TExternalItem>
) {
  return async (
    _: unknown,
    {
      externalId,
      shelfId,
      overrides,
    }: {
      shelfId: TShelfId;
      externalId: string;
      overrides?: ItemOverrides<TItemInput> | null;
    }
  ) => {
    const externalItem = await api.get({ id: externalId });
    if (!externalItem) {
      throw new Error(`Cannot find item for external id ${externalId}`);
    }
    const inputItem = transformExternalItem(
      externalItem,
      shelfId,
      externalItemTransform
    );
    const createItem = await transformAddItemInput(
      uuid(),
      type,
      {
        ...inputItem,
        ...(overrides ? deleteNullOrUndefined(overrides) : {}),
      },
      inputTransform
    );
    const outputItem = await DataMutate.createItem(createItem);
    return transformItem(outputItem, outputTransform);
  };
}
