/** Only allow https://*.zoom.us meeting links (matches frontend rendering rules). */
export function normalizeZoomLink(zoomLink: string | null | undefined): string | null {
    if (!zoomLink) return null;
    const trimmed = zoomLink.trim();
    if (!trimmed) return null;
    try {
        const url = new URL(trimmed);
        if (url.protocol !== 'https:' || !/(^|\.)zoom\.us$/i.test(url.hostname)) {
            return null;
        }
        return url.toString();
    } catch {
        return null;
    }
}
