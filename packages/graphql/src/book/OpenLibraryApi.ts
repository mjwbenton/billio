import axios from "axios";
import qs from "querystring";
import ExternalApi from "../external/ExternalApi";
import parseNamespacedId, {
  buildNamespacedId,
} from "../shared/parseNamespacedId";
import { ExternalBook } from "./types";

const ID_NAMESPACE = "openlibrary";

const SEARCH_URL = "https://openlibrary.org/search.json";
const COVER_BASE_URL = "https://covers.openlibrary.org/b/id";
const WORK_KEY_PREFIX = "/works/";

const BASE_PARAMS = {
  fields: "key,title,author_name,cover_i",
};

export class OpenLibraryApi implements ExternalApi<ExternalBook> {
  public async search({
    term,
  }: {
    term: string;
  }): Promise<Array<ExternalBook>> {
    const url = SEARCH_URL.concat(
      `?${qs.stringify({
        ...BASE_PARAMS,
        q: term,
        limit: 10,
        lang: "en",
      })}`,
    );
    const result = (await axios.get(url)).data;
    return result?.docs?.map(transform) ?? [];
  }

  public async get({ id }: { id: string }): Promise<ExternalBook | null> {
    const { externalId } = parseNamespacedId(id, {
      assertNamespace: ID_NAMESPACE,
    });

    const url = SEARCH_URL.concat(
      `?${qs.stringify({
        ...BASE_PARAMS,
        q: `key:${WORK_KEY_PREFIX}${externalId}`,
        limit: 1,
      })}`,
    );
    const result = (await axios.get(url)).data;
    const item = result?.docs?.[0];
    if (!item) {
      return null;
    }
    return transform(item);
  }
}

function transform(item: any): ExternalBook {
  const externalId = item.key.replace(WORK_KEY_PREFIX, "");
  return {
    id: buildNamespacedId({ namespace: ID_NAMESPACE, externalId }),
    title: item.title,
    imageUrl: item.cover_i ? `${COVER_BASE_URL}/${item.cover_i}-M.jpg` : null,
    author: item.author_name?.[0] ?? "",
  };
}
