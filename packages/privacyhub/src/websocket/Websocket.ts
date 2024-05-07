import { Server } from 'socket.io';
import * as http from "node:http";

const WEBSOCKET_CORS = {
    origin: "*",
    methods: ["GET", "POST"]
}

class Websocket extends Server {

    private static io: Websocket;

    constructor(httpServer: http.Server) {
        super(httpServer, {
            cors: WEBSOCKET_CORS
        });
    }

    public static getInstance(httpServer: http.Server): Websocket {

        if (!Websocket.io) {
            Websocket.io = new Websocket(httpServer);
        }

        return Websocket.io;

    }
}

export default Websocket;