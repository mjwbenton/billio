export interface ImportItem {
  id: string;
  title: string;
  shelf: string;
  addedAt: string;
  movedAt: string;
  notes: string;
  rating: number | null;
}

export interface Source {
  fetch(): Promise<Array<ImportItem>>;
}

export interface Importer {
  importItem(item: ImportItem): Promise<void>;
}

export async function runImport(source: Source, importer: Importer) {
  const items = await source.fetch();
  await Promise.all(items.map((item) => importer.importItem(item)));
}