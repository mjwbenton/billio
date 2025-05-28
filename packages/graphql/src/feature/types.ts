import { ExternalFeature as GQLExternalFeature } from "../generated/graphql";

export type ExternalFeature = Omit<GQLExternalFeature, "importedItem">;
