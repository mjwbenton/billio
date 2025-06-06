require("dotenv").config();
process.env.AWS_SDK_LOAD_CONFIG = "1";
process.env.AWS_PROFILE = "admin-legacy-sso";
process.env.AWS_REGION = "us-east-1";

const STACKS = {
  local: {
    BILLIO_TABLE: "BillioLocalDataV3-ItemTable276B2AC8-1TR74TBIIY3RR",
    BILLIO_IMAGE_BUCKET: "billiotestimage-imagebucket97210811-jdlm9v72wtlf",
    BILLIO_IMAGE_DOMAIN: "https://image-cdn-test.billio.mattb.tech",
  },
  test: {
    BILLIO_TABLE: "BillioTestDataV3-ItemTable276B2AC8-2I5WC5N7N5R0",
    BILLIO_IMAGE_BUCKET: "billiotestimage-imagebucket97210811-jdlm9v72wtlf",
    BILLIO_IMAGE_DOMAIN: "https://image-cdn-test.billio.mattb.tech",
  },
  prod: {
    BILLIO_TABLE: "BillioDataV3-ItemTable276B2AC8-71REK85N61EZ",
    BILLIO_IMAGE_BUCKET: "billioimage-imagebucket97210811-1aeflaj405d4g",
    BILLIO_IMAGE_DOMAIN: "https://image-cdn.billio.mattb.tech",
  },
};
const stack: keyof typeof STACKS =
  (process.env.INFRA_STACK as keyof typeof STACKS) ?? "local";

process.env.BILLIO_TABLE = STACKS[stack].BILLIO_TABLE;
process.env.BILLIO_IMAGE_BUCKET = STACKS[stack].BILLIO_IMAGE_BUCKET;
process.env.BILLIO_IMAGE_DOMAIN = STACKS[stack].BILLIO_IMAGE_DOMAIN;
process.env.ENABLE_MUTATIONS = "1";

import schema from "./schema";
import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { buildSubgraphSchema } from "@apollo/subgraph";

(async () => {
  const server = new ApolloServer({
    schema: buildSubgraphSchema(schema),
  });

  const { url } = await startStandaloneServer(server, {
    listen: { port: 4000 },
  });

  console.log(`🚀  Server ready at: ${url}`);
})();
