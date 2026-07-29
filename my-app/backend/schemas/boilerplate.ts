import { z } from 'zod';

export const ValidatedSchema = z.object({});
export type Input = z.infer<typeof ValidatedSchema>;
