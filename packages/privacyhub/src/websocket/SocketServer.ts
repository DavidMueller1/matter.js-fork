import { Server } from "socket.io";

export default class SocketServer {
    private io: Server
    constructor(io: Server) {
        this.io = io;
    }
}