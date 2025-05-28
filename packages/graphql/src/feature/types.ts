import { ExternalMovie as GQLExternalMovie } from "../generated/graphql";

export type ExternalMovie = Omit<GQLExternalMovie, "importedItem">;
