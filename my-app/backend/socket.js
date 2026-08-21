let io = null;
export function setIo(server) {
    io = server;
}
export function getIo() {
    if (!io)
        throw new Error('Socket.IO not initialized');
    return io;
}
//# sourceMappingURL=socket.js.map