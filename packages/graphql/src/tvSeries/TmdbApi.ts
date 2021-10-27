import axios from "axios";
import qs from "querystring";
import ExternalApi from "../external/ExternalApi";
import { ExternalTvSeries } from "../generated/graphql";
import parseNamespacedId from "../shared/parseNamespacedId";

const API_KEY = process.env.TMDB_API_KEY!;

const IMDB_ID_BASE = "imdb";
const TMDB_ID_BASE = "tmdb";

const BASE_URL = "https://api.themoviedb.org/3";
const GET_ENDPOINT = `${BASE_URL}/tv`;
const FIND_ENDPOINT = `${BASE_URL}/find`;
const SEARCH_ENDPOINT = `${BASE_URL}/search/tv`;

// Hardcoding, but officially available from the configuration API.
// See https://developers.themoviedb.org/3/getting-started/images.
const IMAGE_BASE = "http://image.tmdb.org/t/p/w780";

const BASE_PARAMS = {
  api_key: API_KEY,
  language: "en-US",
};

const GET_PARAMS = {
  ...BASE_PARAMS,
  external_source: "imdb_id",
};

const SEARCH_PARAMS = {
  ...BASE_PARAMS,
  include_adult: "false",
  page: "1",
};

export class TmdbApi implements ExternalApi<ExternalTvSeries> {
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
    return await Promise.all(result?.results?.map((i: any) => this.getTmdb(i)));
  }

  public async get({ id }: { id: string }): Promise<ExternalTvSeries | null> {
    const { namespace, externalId } = parseNamespacedId(id);

    if (namespace === IMDB_ID_BASE) {
      return this.getImdb({ id: externalId });
    }

    if (namespace === TMDB_ID_BASE) {
      return this.getTmdb({ id: externalId });
    }

    throw new Error(`Invalid id, supports namespaces tmdb and imdb: ${id}`);
  }

  private async getTmdb({
    id,
  }: {
    id: string;
  }): Promise<ExternalTvSeries | null> {
    const url = `${GET_ENDPOINT}/${id}?${qs.stringify(BASE_PARAMS)}`;
    const result = (await axios.get(url)).data;
    console.log(JSON.stringify(result, null, 2));
    if (!result.id) {
      return null;
    }
    return transform(result);
  }

  private async getImdb({
    id,
  }: {
    id: string;
  }): Promise<ExternalTvSeries | null> {
    const url = `${FIND_ENDPOINT}/${id}?${qs.stringify(GET_PARAMS)}`;
    const result = (await axios.get(url)).data;
    const movie = result?.movie_results?.[0];
    if (!movie) {
      return null;
    }
    return transform({ ...movie, imdb_id: id });
  }
}

function transform(item: any): ExternalTvSeries {
  return {
    id: item.imdb_id ? `imdbSeries:${item.imdb_id}` : `tmdbSeries:${item.id}`,
    title: item.name,
    imageUrl: item.poster_path ? IMAGE_BASE.concat(item.poster_path) : null,
    seasons:
      item?.seasons?.map((s: any) => ({
        seriesId: `tmdbSeries:${item.id}`,
        seriesTitle: item.name,
        id: `tmdbSeason:${item.id}:${s.season_number}`,
        number: s.season_number,
        imageUrl: s.poster_path ? IMAGE_BASE.concat(s.poster_path) : null,
        title: s.name,
      })) ?? [],
  };
}
