export type ParsedGoogleName = {
    firstName: string | null;
    lastName: string | null;
    /** Full display name stored on User.name — typically "First Last". */
    displayName: string | null;
};

function trimString(value: unknown): string | null {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
}

/**
 * Extract first name, last name, and a display name from Google OAuth user_metadata.
 * Prefers given_name / family_name; falls back to parsing full_name or name.
 */
export function parseGoogleDisplayName(
    userMetadata?: Record<string, unknown> | null,
): ParsedGoogleName {
    const meta = userMetadata ?? {};

    let firstName = trimString(meta.given_name);
    let lastName = trimString(meta.family_name);

    if (firstName && lastName) {
        return {
            firstName,
            lastName,
            displayName: `${firstName} ${lastName}`,
        };
    }

    const fullName = trimString(meta.full_name) ?? trimString(meta.name);
    if (fullName) {
        // / / -> start of regex expression, \s -> whitespace
        const parts = fullName.split(/\s+/);
        if (!firstName && parts.length >= 1) {
            firstName = parts[0] ?? null;
        }
        if (!lastName && parts.length >= 2) {
            lastName = parts.slice(1).join(' ');
        }
        return { firstName, lastName, displayName: fullName };
    }

    return {
        firstName,
        lastName,
        displayName: firstName && lastName ? `${firstName} ${lastName}` : firstName ?? lastName,
    };
}
