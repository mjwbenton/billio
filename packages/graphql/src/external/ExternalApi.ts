export interface ExternalItem {
  id: string;
  title: string;
  imageUrl?: string | null;
}

export interface SearchExternalApi<T extends ExternalItem> {
  search(input: { term: string }): Promise<Array<T>>;
}

export interface GetExternalApi<T extends ExternalItem> {
  get(input: { id: string }): Promise<T | null>;
}

export type ExternalApi<T extends ExternalItem> = SearchExternalApi<T> &
  GetExternalApi<T>;
export default ExternalApi;
