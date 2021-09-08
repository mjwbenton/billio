import { source, importer } from "../imdbRatingsExport";
import { runImport } from "../index";

(async () => {
  await runImport(source, importer);
})();
