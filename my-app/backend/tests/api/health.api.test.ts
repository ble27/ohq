import './setupMocks.js';
import { beforeEach, describe, expect, it } from 'vitest';
import { api } from './testAgent.js';

describe('GET /health', () => {
    it('returns 200 with OK message', async () => {
        const res = await api().get('/health');

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('OK');
        expect(typeof res.body.uptime).toBe('number');
        expect(typeof res.body.timestamp).toBe('number');
    });
});
