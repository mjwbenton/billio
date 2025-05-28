process.env.AWS_SDK_LOAD_CONFIG = "1";
process.env.AWS_PROFILE = "admin-legacy-sso";
process.env.AWS_REGION = "us-east-1";
process.env.BILLIO_TABLE = "BillioDataV2-ItemTable276B2AC8-1NBN3P38AYOHE";

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
