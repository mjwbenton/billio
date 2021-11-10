import {
  ExternalTvSeries as GQLExternalTvSeries,
  ExternalTvSeason as GQLExternalTvSeason,
} from "../generated/graphql";

export type ExternalTvSeries = Omit<GQLExternalTvSeries, "importedItem">;
export type ExternalTvSeason = Omit<GQLExternalTvSeason, "importedItem">;
