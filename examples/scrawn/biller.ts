import { createScrawn } from "@scrawn/core";
import { TAGS } from "./tags.ts";

export const biller = createScrawn({
  apiKey: process.env.SCRAWN_KEY as string,
  baseURL: process.env.SCRAWN_BASE_URL as string,
  tags: TAGS,
});
