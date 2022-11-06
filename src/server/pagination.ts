import { z } from "zod";

export const paginationInput = {
  limit: z.number().min(1).max(100).nullish(),
  cursor: z.string().nullish(),
};
