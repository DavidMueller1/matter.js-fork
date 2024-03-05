import { Logger } from "@project-chip/matter-node.js/log";

import express, { Application, Request, Response } from "express";
import PrivacyhubNode from "./PrivacyhubNode.js";

export default class PrivacyhubBackend {
    private app: Application;
    private readonly port: number;
    private readonly logger: Logger;

    private readonly privacyhubNode: PrivacyhubNode;

    constructor(privacyhubNode: PrivacyhubNode) {
        this.privacyhubNode = privacyhubNode;

        this.logger = Logger.get("PrivacyhubBackend");
        this.logger.info("Starting Privacyhub backend...")
        process.env.PORT ? this.port = parseInt(process.env.PORT) : this.port = 8000;
        this.app = express();

        this.setupExpress()
        this.setupRoutes()
        this.app.listen(this.port, () => {
            this.logger.info(`Server is Fire at http://localhost:${this.port}`);
        });
    }

    private setupExpress(): void {
        this.app.use(express.json());
    }

    private setupRoutes(): void {
        /**
         * @api {get} /
         * @apiName Index
         */
        this.app.get('/', (_, res: Response) => {
            res.send('Welcome to the most private hub EU west');
        });

        /**
         * @api {post} /pairing/ble-thread BLE Thread Pairing
         * @apiName BLE Thread Pairing
         * @apiGroup Pairing
         *
         * @apiBody {String} pairingCode Device pairing code
         * @apiBody {String} threadNetworkName Name of the thread network
         * @apiBody {String} threadNetworkOperationalDataset Operational dataset of the thread network as hex string
         *
         * @apiSuccess {String} device_id The device ID.
         */
        this.app.post('/pairing/ble-thread', (req: Request, res: Response) => {
            // Log JSON body
            this.logger.info("Received BLE Thread pairing request:");
            this.logger.info(JSON.stringify(req.body, null, 2));

            // Check if the request body has the required fields
            if (!req.body.pairingCode || !req.body.threadNetworkName || !req.body.threadNetworkOperationalDataset) {
                res.status(400).send("Missing required fields. Needed: {pairingCode: number, threadNetworkName: string, threadNetworkOperationalDataset: string}");
                return;
            }

            this.privacyhubNode.commissionNodeBLEThread(
                req.body.pairingCode,
                req.body.threadNetworkName,
                req.body.threadNetworkOperationalDataset
            ).then(() => {
                res.send("Commissioned node successfully");
            }).catch((error) => {
                res.status(500).send(`Error commissioning node: ${error}`);
            });
        });
    }
}