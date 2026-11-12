import { z } from "zod";

export function decimalAmountSchema({ min = 0 } = {}) {
  return z
    .union([
      z.number().finite().refine((value) => Math.round(value * 100) / 100 === value),
      z
        .string()
        .trim()
        .regex(/^\d+(?:\.\d{1,2})?$/, "Utilisez au maximum deux décimales.")
        .transform(Number),
    ])
    .pipe(z.number().finite().min(min).max(99999999.99));
}

export const wholeNumberSchema = z
  .union([
    z.number().int(),
    z.string().regex(/^\d+$/).transform(Number),
  ])
  .pipe(z.number().int().min(0));
