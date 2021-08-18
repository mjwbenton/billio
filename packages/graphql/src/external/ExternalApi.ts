export interface ExternalItem {
  id: string;
  title: string;
  imageUrl?: string | null;
}

export default interface ExternalApi<T extends ExternalItem> {
  search(input: { term: string }): Promise<Array<T>>;
  get(input: { id: string }): Promise<T | null>;
}
