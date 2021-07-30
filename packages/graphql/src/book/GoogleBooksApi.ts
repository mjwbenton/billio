import axios from "axios";
import qs from "querystring";
import ExternalApi from "../external/ExternalApi";
import { ExternalBook } from "../generated/graphql";

const ID_BASE = "googlebooks";

const BASE_URL = "https://www.googleapis.com/books/v1/volumes";

const BASE_PARAMS = {
  maxResults: 10,
  langRestrict: "en",
};

export class GoogleBooksApi implements ExternalApi<ExternalBook> {
  public async search({
    term,
  }: {
    term: string;
  }): Promise<Array<ExternalBook>> {
    const url = BASE_URL.concat(
      `?${qs.stringify({
        ...BASE_PARAMS,
        q: term,
      })}`
    );
    const result = (await axios.get(url)).data;
    return result?.items?.map(transform) ?? [];
  }

  public async get({ id }: { id: string }): Promise<ExternalBook | null> {
    const url = BASE_URL.concat(`/${id.split(":")[1]}`);
    const result = (await axios.get(url)).data;
    if (result.error) {
      return null;
    }
    return transform(result);
  }
}

function transform(item: any): ExternalBook {
  return {
    id: `${ID_BASE}:${item.id}`,
    title: item.volumeInfo.title,
    imageUrl: item.volumeInfo.imageLinks?.thumbnail ?? null,
    author: item.volumeInfo.authors?.[0] ?? "",
  };
}
