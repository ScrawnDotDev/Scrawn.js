import { scrawn } from "@scrawn/core";
import { TAGS, EXPRESSIONS } from "./pricerefs.ts";

export const biller = scrawn({
  apiKey: process.env.SCRAWN_KEY as string,
  baseURL: process.env.SCRAWN_BASE_URL as string,
  secure: process.env.SCRAWN_BASE_URL?.startsWith("https") ?? false,
  tags: TAGS,
  expressions: EXPRESSIONS,
});
