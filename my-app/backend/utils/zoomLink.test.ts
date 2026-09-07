import { describe, expect, it } from 'vitest';
import { normalizeZoomLink } from './zoomLink.js';

describe('normalizeZoomLink', () => {
    it('accepts https zoom.us meeting links', () => {
        expect(normalizeZoomLink('https://zoom.us/j/123456789')).toBe('https://zoom.us/j/123456789');
        expect(normalizeZoomLink('https://us06web.zoom.us/j/123456789')).toBe(
            'https://us06web.zoom.us/j/123456789',
        );
    });

    it('rejects non-https and non-zoom hosts', () => {
        expect(normalizeZoomLink('http://zoom.us/j/123')).toBeNull();
        expect(normalizeZoomLink('https://evil.com/zoom.us')).toBeNull();
        expect(normalizeZoomLink('https://zoom.us.evil.com/j/123')).toBeNull();
    });

    it('treats empty input as null', () => {
        expect(normalizeZoomLink('')).toBeNull();
        expect(normalizeZoomLink('   ')).toBeNull();
        expect(normalizeZoomLink(null)).toBeNull();
        expect(normalizeZoomLink(undefined)).toBeNull();
    });
});
