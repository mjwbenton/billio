import { App } from "@aws-cdk/core";
import BillioAuthStack from "./BillioAuthStack";
import BillioDataStack from "./BillioDataStack";

const app = new App();
new BillioDataStack(app, "BillioData");
new BillioAuthStack(app, "BillioAuth");
