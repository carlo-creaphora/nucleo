import { handle } from "@hono/node-server/vercel";
import { createApp } from "../src/http/app.js";

export const config = {
  runtime: "nodejs",
};

export default handle(createApp());
