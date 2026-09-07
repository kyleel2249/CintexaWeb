import { createApp } from "./app.js";
import { env } from "./lib/env.js";

const app = createApp();

app.listen(env.PORT, () => {
  console.log(`CINTEXA API listening on :${env.PORT} (${env.NODE_ENV})`);
});
