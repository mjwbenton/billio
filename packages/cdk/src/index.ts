import { App } from "@aws-cdk/core";
import BillioAdminStack from "./BillioAdminStack";
import BillioApiStack from "./BillioApiStack";
import BillioAuthStack from "./BillioAuthStack";
import BillioDataStack from "./BillioDataStack";
import BillioImageStack from "./BillioImageStack";
import BillioCDNStack from "./BillioCDNStack";
import BillioBackupStack from "./BillioBackupStack";

const app = new App();

// Production Stacks
const dataStack = new BillioDataStack(app, "BillioData");
const imageStack = new BillioImageStack(app, "BillioImage");
const authStack = new BillioAuthStack(app, "BillioAuth");
const cdnStack = new BillioCDNStack(app, "BillioCDN", {
  imageStack,
  domainName: "image-cdn.billio.mattb.tech",
});
const apiStack = new BillioApiStack(app, "BillioAPI", {
  dataStack,
  imageStack,
  cdnStack,
  domainName: "api.billio.mattb.tech",
  enableIam: true,
  enableMutations: true,
});
apiStack.grantCall(authStack.authenticatedUserRole);
new BillioAdminStack(app, "BillioAdmin");
new BillioApiStack(app, "BillioReadonlyAPI", {
  dataStack,
  imageStack,
  cdnStack,
  domainName: "api-readonly.billio.mattb.tech",
  enableIam: false,
  enableMutations: false,
});
new BillioBackupStack(app, "BillioBackup", {
  dataStack,
});

// Integration test stacks
const integrationDataStack = new BillioDataStack(app, "BillioTestData");
const integrationImageStack = new BillioImageStack(app, "BillioTestImage");
const integrationCdnStack = new BillioCDNStack(app, "BillioTestCDN", {
  imageStack: integrationImageStack,
  domainName: "image-cdn-test.billio.mattb.tech",
});
new BillioApiStack(app, "BillioTestAPI", {
  dataStack: integrationDataStack,
  imageStack: integrationImageStack,
  cdnStack: integrationCdnStack,
  domainName: "api-test.billio.mattb.tech",
  enableIam: false,
  enableMutations: true,
});
