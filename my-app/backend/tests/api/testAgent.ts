import request from 'supertest';
import { createApp } from '../../createApp.js';

const app = createApp();

export function api() {
    return request(app);
}

export function asUser(userId: string) {
    return {
        get: (url: string) => api().get(url).set('x-test-user-id', userId),
        post: (url: string) => api().post(url).set('x-test-user-id', userId),
        patch: (url: string) => api().patch(url).set('x-test-user-id', userId),
        delete: (url: string) => api().delete(url).set('x-test-user-id', userId),
    };
}
