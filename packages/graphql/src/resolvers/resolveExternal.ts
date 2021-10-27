import { ExternalItem, SearchExternalApi } from "../external/ExternalApi";

export default function resolveExternal<T extends ExternalItem>(
  api: SearchExternalApi<T>
) {
  return async (_: unknown, { term }: { term: string }) => api.search({ term });
}
