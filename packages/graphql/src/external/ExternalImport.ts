import { Resolver, ClassType, Query, Mutation, Arg } from "type-graphql";
import Item from "../Item";
import { AddItemInput, ItemMutationResolver } from "../ItemMutation";
import StringKey from "../util/StringKey";
import ExternalApi from "./ExternalApi";

export function ExternalImportResolverFactory<
  TExternalItem,
  TItem extends Item,
  TShelfEnum extends object,
  TAddItemInput extends AddItemInput,
  TExternalApi extends ExternalApi<TExternalItem>,
  TItemMutationResolver extends ItemMutationResolver<TItem, TAddItemInput, any>
>(
  TExternalItem: ClassType<TExternalItem>,
  TItem: ClassType<TItem>,
  TShelfEnum: TShelfEnum,
  TAddItemInput: ClassType<TAddItemInput>,
  externalApi: TExternalApi,
  itemMutationResolver: TItemMutationResolver,
  transform: (
    input: TExternalItem,
    shelfId: StringKey<TShelfEnum>
  ) => TAddItemInput
) {
  @Resolver()
  class ExternalResolverImpl {
    @Query((returns) => [TExternalItem], {
      name: `searchExternal${TItem.name}`,
    })
    searchExternal(@Arg("term") term: string): Promise<Array<TExternalItem>> {
      return externalApi.search({ term });
    }

    @Mutation((returns) => TItem, { name: `importExternal${TItem.name}` })
    async importExternal(
      @Arg("id") id: string,
      @Arg("shelfId", (type) => TShelfEnum) shelfId: StringKey<TShelfEnum>
    ): Promise<TItem> {
      const externalItem = await externalApi.get({ id });
      if (!externalItem) {
        throw new Error(`Cannot find item for id ${id}`);
      }
      return itemMutationResolver.addItem(transform(externalItem, shelfId));
    }
  }
  return ExternalResolverImpl;
}
