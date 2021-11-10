import { ExternalVideoGame as GQLExternalVideoGame } from "../generated/graphql";

export type ExternalVideoGame = Omit<GQLExternalVideoGame, "importedItem">;
