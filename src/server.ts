import "dotenv/config";
import { serve } from "@hono/node-server";
import { createApp } from "./http/app.js";

const port = Number(process.env.PORT || 3000);

serve(
  {
    fetch: createApp().fetch,
    port,
  },
  (info) => {
    console.log(`Nucleo API escuchando en http://localhost:${info.port}/api`);
  },
);

