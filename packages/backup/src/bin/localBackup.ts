import { TYPES } from "@mattb.tech/billio-config";
import { fetchAllForType } from "../index";
import fs from "fs/promises";

(async () => {
  await Promise.all(
    TYPES.map(async (type) => {
      const result = await fetchAllForType(type);
      await fs.writeFile(
        `./local/${type}.json`,
        JSON.stringify(result, null, 2),
      );
    }),
  );
})();
