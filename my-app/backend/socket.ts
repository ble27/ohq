// Save Socket.IO server instance to be used by other backend routes
import type { Server } from 'socket.io'

let io: Server | null = null;

export function setIo(server: Server) {
    io = server;
}

export function getIo() {
    if (!io) throw new Error('Socket.IO not initialized');
    return io;
}