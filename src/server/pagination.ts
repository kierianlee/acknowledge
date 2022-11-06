import { z } from "zod";

export const limitSelectOptions = [
  {
    label: "10 per page",
    value: "10",
  },
  {
    label: "25 per page",
    value: "20",
  },
  {
    label: "50 per page",
    value: "50",
  },
];

export const cursorPaginationInput = {
  limit: z.number().min(1).max(100).nullish(),
  cursor: z.string().nullish(),
};

export const offsetPaginationInput = {
  limit: z.number().min(1).max(100).nullish(),
  skip: z.number().min(0).nullish(),
};
