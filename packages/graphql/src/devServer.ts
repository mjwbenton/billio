require("dotenv").config();
process.env.AWS_SDK_LOAD_CONFIG = "1";
process.env.AWS_PROFILE = "admin";
process.env.AWS_REGION = "us-east-1";

const STACKS = {
  local: {
    BILLIO_DSQL_ENDPOINT: "3btnvhteqsynk2pmi2iikzsxsm.dsql.us-east-1.on.aws",
    BILLIO_IMAGE_BUCKET: "billiotestimage-imagebucket97210811-jdlm9v72wtlf",
    BILLIO_IMAGE_DOMAIN: "https://image-cdn-test.billio.mattb.tech",
  },
  test: {
    BILLIO_DSQL_ENDPOINT: "cztnvhszomywukvrfxko4fhjrq.dsql.us-east-1.on.aws",
    BILLIO_IMAGE_BUCKET: "billiotestimage-imagebucket97210811-jdlm9v72wtlf",
    BILLIO_IMAGE_DOMAIN: "https://image-cdn-test.billio.mattb.tech",
  },
  prod: {
    BILLIO_DSQL_ENDPOINT: "p5tnvhwkusq4zbisuilfpmek34.dsql.us-east-1.on.aws",
    BILLIO_IMAGE_BUCKET: "billioimage-imagebucket97210811-1aeflaj405d4g",
    BILLIO_IMAGE_DOMAIN: "https://image-cdn.billio.mattb.tech",
  },
};
const stack: keyof typeof STACKS =
  (process.env.INFRA_STACK as keyof typeof STACKS) ?? "local";

process.env.BILLIO_DSQL_ENDPOINT = STACKS[stack].BILLIO_DSQL_ENDPOINT;
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
