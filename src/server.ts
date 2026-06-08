import { app } from "./app.js";
import { env } from "./env.js";

app.listen(env.port, () => {
  console.log(`IGS API running on port ${env.port}`);
});
