import { describe, expect, it } from 'vitest';
import { ZoomLinkBodySchema } from './queue.schema.js';

describe('ZoomLinkBodySchema', () => {
    it('normalizes valid zoom links and clears empty values', () => {
        expect(ZoomLinkBodySchema.parse({ zoomLink: 'https://zoom.us/j/123' }).zoomLink).toBe(
            'https://zoom.us/j/123',
        );
        expect(ZoomLinkBodySchema.parse({ zoomLink: '' }).zoomLink).toBeNull();
        expect(ZoomLinkBodySchema.parse({}).zoomLink).toBeNull();
    });

    it('rejects invalid zoom links', () => {
        expect(() => ZoomLinkBodySchema.parse({ zoomLink: 'https://evil.com' })).toThrow();
        expect(() => ZoomLinkBodySchema.parse({ zoomLink: 'not-a-url' })).toThrow();
    });
});
