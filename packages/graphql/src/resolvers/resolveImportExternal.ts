import { ItemInput, ItemOverrides } from "../shared/Item";
import {
  Item as DataItem,
  Mutate as DataMutate,
} from "@mattb.tech/billio-data";
import { Item } from "../generated/graphql";
import { v4 as uuid } from "uuid";
import {
  FieldTransform,
  transformAddItemInput,
  transformExternalItem,
  transformItem,
} from "../shared/transforms";
import { ExternalItem, GetExternalApi } from "../external/ExternalApi";

export default function resolveImportExternal<
  TItem extends Item,
  TShelfId extends string,
  TInputType extends ItemInput,
  TExternalItem extends ExternalItem
>(
  type: string,
  outputTransform: FieldTransform<TItem, DataItem>,
  inputTransform: FieldTransform<DataItem, TInputType>,
  externalItemTransform: FieldTransform<TInputType, TExternalItem>,
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
      overrides?: ItemOverrides<TInputType> | null;
    }
  ) => {
    const externalItem = await api.get({ id: externalId });
    if (!externalItem) {
      throw new Error(`Cannot find item for external id ${externalId}`);
    }
    const outputItem = await DataMutate.createItem({
      ...(await transformAddItemInput(
        {
          ...transformExternalItem(
            externalItem,
            shelfId,
            externalItemTransform
          ),
          ...overrides,
        },
        inputTransform
      )),
      id: uuid(),
      externalId: externalItem.id ?? externalId,
      type,
    });
    return transformItem(outputItem, outputTransform);
  };
}
