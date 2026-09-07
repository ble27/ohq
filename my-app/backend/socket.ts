import type { Server } from 'socket.io'

let io: Server | null = null;

/** Stores the Socket.IO server instance for use in routes and services. */
export function setIo(server: Server) {
    io = server;
}

/** Returns the initialized Socket.IO server. */
export function getIo() {
    if (!io) throw new Error('Socket.IO not initialized');
    return io;
}