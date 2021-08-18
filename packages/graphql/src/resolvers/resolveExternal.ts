import ExternalApi, { ExternalItem } from "../external/ExternalApi";

export default function resolveExternal<T extends ExternalItem>(
  api: ExternalApi<T>
) {
  return async (_: unknown, { term }: { term: string }) => api.search({ term });
}
