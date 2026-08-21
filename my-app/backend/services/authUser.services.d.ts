export type ParsedGoogleName = {
    firstName: string | null;
    lastName: string | null;
    /** Full display name stored on User.name — typically "First Last". */
    displayName: string | null;
};
/**
 * Extract first name, last name, and a display name from Google OAuth user_metadata.
 * Prefers given_name / family_name; falls back to parsing full_name or name.
 */
export declare function parseGoogleDisplayName(userMetadata?: Record<string, unknown> | null): ParsedGoogleName;
//# sourceMappingURL=authUser.services.d.ts.map