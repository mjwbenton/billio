import { App } from "@aws-cdk/core";
import BillioApiStack from "./BillioApiStack";
import BillioAuthStack from "./BillioAuthStack";
import BillioDataStack from "./BillioDataStack";

const app = new App();
const dataStack = new BillioDataStack(app, "BillioData");
new BillioAuthStack(app, "BillioAuth");
new BillioApiStack(app, "BillioAPI", { dataStack });
