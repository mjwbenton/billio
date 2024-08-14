process.env.AWS_PROFILE = "mattb.tech-deploy";
process.env.AWS_REGION = "us-east-1";
process.env.BILLIO_TABLE = "BillioLocalData-ItemTable276B2AC8-ONQOGA6OFVXN";
// process.env.BILLIO_TABLE = "BillioData-ItemTable276B2AC8-1HIYN64N2BKA1";

import { TYPES } from "@mattb.tech/billio-config";
import fs from "fs/promises";
import path from "path";
import { writeAll, Failure } from "../";

const BASE_PATH = path.join(__dirname, "../../../backup/local/");

(async () => {
  await Promise.all(
    TYPES.map(async (type) => {
      const items = JSON.parse(
        await fs.readFile(path.join(BASE_PATH, `${type}.json`), "utf-8"),
      );
      const results = await writeAll(items);
      console.log(
        `Finished ${type}: ${
          results.filter(({ success }) => success).length
        } success, ${results.filter(({ success }) => !success).length} failure.`,
      );
      results
        .filter((r): r is Failure => !r.success)
        .forEach(({ error }) => {
          console.log(error);
        });
    }),
  );
})();
