export default interface ExternalApi<T> {
  search(input: { term: string }): Promise<Array<T>>;
  get(input: { id: string }): Promise<T | null>;
}
