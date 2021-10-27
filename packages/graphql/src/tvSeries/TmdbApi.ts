import axios from "axios";
import qs from "querystring";
import ExternalApi, { GetExternalApi } from "../external/ExternalApi";
import { ExternalTvSeason, ExternalTvSeries } from "../generated/graphql";
import parseNamespacedId, {
  buildNamespacedId,
} from "../shared/parseNamespacedId";

const API_KEY = process.env.TMDB_API_KEY!;

const SERIES_ID_NAMESPACE = "tmdbSeries";
const SEASON_ID_NAMESPACE = "tmdbSeason";

const BASE_URL = "https://api.themoviedb.org/3";
const GET_ENDPOINT = `${BASE_URL}/tv`;
const SEASON_SUBENDPOINT = "season";
const SEARCH_ENDPOINT = `${BASE_URL}/search/tv`;

// Hardcoding, but officially available from the configuration API.
// See https://developers.themoviedb.org/3/getting-started/images.
const IMAGE_BASE = "http://image.tmdb.org/t/p/w780";

const BASE_PARAMS = {
  api_key: API_KEY,
  language: "en-US",
};

const SEARCH_PARAMS = {
  ...BASE_PARAMS,
  include_adult: "false",
  page: "1",
};

export class TmdbSeriesApi implements ExternalApi<ExternalTvSeries> {
  public async search({
    term,
  }: {
    term: string;
  }): Promise<Array<ExternalTvSeries>> {
    const url = `${SEARCH_ENDPOINT}?${qs.stringify({
      ...SEARCH_PARAMS,
      query: term,
    })}`;
    const result = (await axios.get(url)).data;
    return await Promise.all(
      result?.results?.map((i: any) =>
        this.get({
          id: buildNamespacedId({
            namespace: SERIES_ID_NAMESPACE,
            externalId: i.id,
          }),
        })
      )
    );
  }

  public async get({ id }: { id: string }): Promise<ExternalTvSeries | null> {
    const { externalId } = parseNamespacedId(id, {
      assertNamespace: SERIES_ID_NAMESPACE,
    });
    const url = `${GET_ENDPOINT}/${externalId}?${qs.stringify(BASE_PARAMS)}`;
    const result = (await axios.get(url)).data;
    if (!result.id) {
      return null;
    }
    return transformSeries(result);
  }
}

export class TmdbSeasonApi implements GetExternalApi<ExternalTvSeason> {
  async get({ id }: { id: string }): Promise<ExternalTvSeason | null> {
    const {
      externalId,
      additionalSections: [seasonNumber],
    } = parseNamespacedId(id, {
      assertNamespace: SEASON_ID_NAMESPACE,
      idSections: 3,
    });
    const seriesUrl = `${GET_ENDPOINT}/${externalId}?${qs.stringify(
      BASE_PARAMS
    )}`;
    const seasonUrl = `${GET_ENDPOINT}/${externalId}/${SEASON_SUBENDPOINT}/${seasonNumber}?${qs.stringify(
      BASE_PARAMS
    )}`;
    const [series, season] = (
      await Promise.all([axios.get(seriesUrl), axios.get(seasonUrl)])
    ).map((r: any) => r.data);
    if (!season.id) {
      return null;
    }
    return transformSeason({ series, season });
  }
}

function transformSeries(item: any): ExternalTvSeries {
  return {
    id: buildNamespacedId({
      namespace: SERIES_ID_NAMESPACE,
      externalId: item.id,
    }),
    title: item.name,
    imageUrl: item.poster_path ? IMAGE_BASE.concat(item.poster_path) : null,
    seasons:
      item?.seasons?.map((season: any) =>
        transformSeason({ season, series: item })
      ) ?? [],
  };
}

function transformSeason({
  series,
  season,
}: {
  series: any;
  season: any;
}): ExternalTvSeason {
  return {
    seriesExternalId: buildNamespacedId({
      namespace: SERIES_ID_NAMESPACE,
      externalId: series.id,
    }),
    title: series.name,
    id: buildNamespacedId({
      namespace: SEASON_ID_NAMESPACE,
      externalId: series.id,
      additionalSections: [season.season_number],
    }),
    seasonNumber: season.season_number,
    imageUrl: season.poster_path ? IMAGE_BASE.concat(season.poster_path) : null,
    seasonTitle: season.name,
  };
}
