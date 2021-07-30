import ExternalApi from "../external/ExternalApi";

export default function resolveExternal<T>(api: ExternalApi<T>) {
  return async (_: unknown, { term }: { term: string }) => api.search({ term });
}
