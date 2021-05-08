import axios from "axios";
import { Service } from "typedi";
import qs from "querystring";
import { Field, ID, ObjectType } from "type-graphql";
import ExternalApi from "../external/ExternalApi";

const ID_BASE = "igdb";

const CLIENT_ID = process.env.IGDB_CLIENT_ID!;
const CLIENT_SECRET = process.env.IGDB_CLIENT_SECRET!;

const AUTH_URL = "https://id.twitch.tv/oauth2/token";
const GAMES_URL = "https://api.igdb.com/v4/games/";

@ObjectType()
export class ExternalVideoGame {
  @Field((type) => ID)
  id: string;
  @Field()
  title: string;
}

@Service()
export class IgdbApi implements ExternalApi<ExternalVideoGame> {
  private accessToken: string | undefined;
  public async search({
    term,
  }: {
    term: string;
  }): Promise<Array<ExternalVideoGame>> {
    const result = await axios.post(
      GAMES_URL,
      `search "${term}"; fields name; limit 10;`,
      {
        headers: await this.buildHeaders(),
      }
    );
    return result.data.map(transform);
  }

  public async get({ id }: { id: string }): Promise<ExternalVideoGame | null> {
    const result = await axios.post(
      GAMES_URL,
      `fields name; where id = ${id.split(":")[1]};`,
      { headers: await this.buildHeaders() }
    );
    return result.data ? transform(result.data[0]) : null;
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
    id: `${ID_BASE}:${item.id}`,
    title: item.name,
  };
}
