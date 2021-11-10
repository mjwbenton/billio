import { ExternalBook as GQLExternalBook } from "../generated/graphql";

export type ExternalBook = Omit<GQLExternalBook, "importedItem">;
