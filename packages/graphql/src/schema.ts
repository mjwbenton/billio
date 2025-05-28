import sharedModule from "./shared/schema";
import watchingModule from "./watching";
import videogameModule from "./videogame";
import featureModule from "./feature";
import bookModule from "./book";
import tvSeriesModule from "./tvSeries";
import { combineModules } from "./shared/gqlModule";

const ENABLE_MUTATIONS = !!parseInt(process.env.ENABLE_MUTATIONS ?? "0");

export default combineModules(
  sharedModule,
  bookModule,
  watchingModule,
  videogameModule,
  featureModule,
  tvSeriesModule,
).schema(ENABLE_MUTATIONS);
