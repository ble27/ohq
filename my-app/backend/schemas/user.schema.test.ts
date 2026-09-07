import { describe, expect, it } from 'vitest';
import {
    DefaultLocationUpdateSchema,
    DisplayNameUpdateSchema,
    NotificationAlertUpdateSchema,
} from './user.schema.js';

describe('DisplayNameUpdateSchema', () => {
    it('accepts names between 1 and 100 characters', () => {
        expect(DisplayNameUpdateSchema.parse({ name: 'Ada Lovelace' }).name).toBe('Ada Lovelace');
        expect(DisplayNameUpdateSchema.parse({ name: 'A' }).name).toBe('A');
    });

    it('rejects empty or overlong names', () => {
        expect(() => DisplayNameUpdateSchema.parse({ name: '' })).toThrow();
        expect(() => DisplayNameUpdateSchema.parse({ name: '   ' })).toThrow();
        expect(() => DisplayNameUpdateSchema.parse({ name: 'x'.repeat(101) })).toThrow();
    });
});

describe('DefaultLocationUpdateSchema', () => {
    it('requires 2–50 trimmed characters', () => {
        expect(DefaultLocationUpdateSchema.parse({ defaultLocation: 'Room 101' }).defaultLocation).toBe(
            'Room 101',
        );
        expect(() => DefaultLocationUpdateSchema.parse({ defaultLocation: 'A' })).toThrow();
    });
});

describe('NotificationAlertUpdateSchema', () => {
    it('requires a boolean status', () => {
        expect(NotificationAlertUpdateSchema.parse({ status: true }).status).toBe(true);
        expect(() => NotificationAlertUpdateSchema.parse({ status: 'yes' })).toThrow();
    });
});
