import axios from "axios";
import qs from "querystring";
import ExternalApi from "../external/ExternalApi";
import parseNamespacedId, {
  buildNamespacedId,
} from "../shared/parseNamespacedId";
import { ExternalVideoGame } from "./types";

const ID_NAMESPACE = "igdb";

const CLIENT_ID = process.env.IGDB_CLIENT_ID!;
const CLIENT_SECRET = process.env.IGDB_CLIENT_SECRET!;

const AUTH_URL = "https://id.twitch.tv/oauth2/token";
const GAMES_URL = "https://api.igdb.com/v4/games/";

const FIELDS = "name, cover.image_id";

const IMAGE_BASE_URL = "https://images.igdb.com/igdb/image/upload";
const LARGE_SIZE = "t_cover_big_2x";
const SMALL_SIZE = "t_cover_small";
const JPG = ".jpg";

export class IgdbApi implements ExternalApi<ExternalVideoGame> {
  private accessToken: string | undefined;

  public async search({
    term,
  }: {
    term: string;
  }): Promise<Array<ExternalVideoGame>> {
    const result = await axios.post(
      GAMES_URL,
      `search "${term}"; fields ${FIELDS}; limit 10;`,
      {
        headers: await this.buildHeaders(),
      }
    );
    return result.data.map(transform);
  }

  public async get({ id }: { id: string }): Promise<ExternalVideoGame | null> {
    const { externalId } = parseNamespacedId(id, {
      assertNamespace: ID_NAMESPACE,
    });

    const result = await axios.post(
      GAMES_URL,
      `fields ${FIELDS}; where id = ${externalId};`,
      { headers: await this.buildHeaders() }
    );
    if (!result.data) {
      return null;
    }
    return transform(result.data[0]);
  }

  private async getAccessToken(): Promise<string> {
    if (!this.accessToken) {
      const result = await axios.post(
        AUTH_URL.concat(
          `?${qs.stringify({
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            grant_type: "client_credentials",
          })}`
        )
      );
      if (result.status !== 200) {
        throw new Error(`Failed Auth: ${JSON.stringify(result.data)}`);
      }
      this.accessToken = result.data.access_token;
    }
    return this.accessToken!;
  }

  private async buildHeaders(): Promise<{ [key: string]: string }> {
    const accessToken = await this.getAccessToken();
    return {
      "Client-ID": CLIENT_ID,
      Authorization: `Bearer ${accessToken}`,
    };
  }
}

function transform(item: any): ExternalVideoGame {
  return {
    id: buildNamespacedId({ namespace: ID_NAMESPACE, externalId: item.id }),
    title: item.name,
    ...(item.cover
      ? {
          previewImageUrl: `${IMAGE_BASE_URL}/${SMALL_SIZE}/${item.cover.image_id}${JPG}`,
          imageUrl: `${IMAGE_BASE_URL}/${LARGE_SIZE}/${item.cover.image_id}${JPG}`,
        }
      : {}),
  };
}
