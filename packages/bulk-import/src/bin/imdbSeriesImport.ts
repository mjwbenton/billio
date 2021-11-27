import { source, importer } from "../imdbSeriesImport";
import { runImport } from "../index";

(async () => {
  await runImport(source, importer);
})();
