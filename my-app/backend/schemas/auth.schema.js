import { z } from 'zod';
/*
// [email/password — disabled for Google-only auth]
export const SignupSchema = z.object({
    email: z.email({ message: 'Invalid email format' }),
    password: z.string().min(8, { message: 'Password must be at least 8 characters' }),
    name: z.string().trim().min(1).optional(),
});

export const SigninSchema = z.object({
    email: z.email({ message: 'Invalid email format' }),
    password: z.string().min(1, { message: 'Password is required' }),
});

export type SignupInput = z.infer<typeof SignupSchema>;
export type SigninInput = z.infer<typeof SigninSchema>;
*/
/** Placeholder export so the module remains valid if re-imported later. */
export const AuthSchemaDeprecated = z.object({});
//# sourceMappingURL=auth.schema.js.map