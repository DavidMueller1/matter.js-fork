import { Logger } from "@project-chip/matter-node.js/log";

import express, { Application, Request, Response } from "express";
import PrivacyhubNode from "./PrivacyhubNode.js";
import { stringifyWithBigint } from "./Util.js";
import NeoPixelController, { LedState } from "./NeoPixelController.js";

export default class PrivacyhubBackend {
    private app: Application;
    private readonly port: number;
    private readonly logger: Logger;

    private readonly privacyhubNode: PrivacyhubNode;
    private readonly neoPixelController: NeoPixelController;

    constructor(privacyhubNode: PrivacyhubNode, neoPixelController: NeoPixelController) {
        this.privacyhubNode = privacyhubNode;
        this.neoPixelController = neoPixelController;

        this.logger = Logger.get("PrivacyhubBackend");
        this.logger.info("Starting Privacyhub backend...")
        process.env.PORT ? this.port = parseInt(process.env.PORT) : this.port = 8000;
        this.app = express();

        this.setupExpress()
        this.setupRoutes()
        this.app.listen(this.port, () => {
            this.logger.info(`Server is Fire at http://localhost:${this.port}`);
            this.neoPixelController.switchToState(LedState.SINGLE, { color: NeoPixelController.hsvToHex(120, 1, 1) });
        });
    }

    private setupExpress(): void {
        this.app.use(express.json());
    }

    private setupRoutes(): void {
        /**
         * @api {get} / Index
         * @apiName Index
         * @apiGroup Utility
         */
        this.app.get('/', (_, res: Response) => {
            res.send('Welcome to the most private hub EU west');
        });

        /**
         * @api {get} /nodes List Nodes
         * @apiName List Nodes
         * @apiGroup Nodes
         *
         * @apiSuccess {Object[]} nodes List of nodes
         */
        this.app.get('/nodes', (_, res: Response) => {
            const nodeList = this.privacyhubNode.getCommissionedNodes()
            const response = {
                nodes: nodeList
            }
            res.send(stringifyWithBigint(response));
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

        /**
         * @api {post} /debug/led/state Set LED state
         * @apiName Set LED state
         * @apiGroup Debug
         *
         * @apiBody {String} ledState LED state
         * @apiBody {number} hue Color hue
         * @apiBody {number} saturation Color saturation
         * @apiBody {number} val Color value
         */
        this.app.post('/debug/led/state', (req: Request, res: Response) => {
            // Log JSON body
            this.logger.info("Received LED state change request:");
            this.logger.info(JSON.stringify(req.body, null, 2));

            // Check if the request body has the required fields
            if (!req.body.ledState || req.body.hue == undefined || req.body.saturation == undefined || req.body.val == undefined) {
                res.status(400).send("Missing required fields. Needed: {state: string, hue: number, saturation: number, value: number}");
                return;
            }

            // Set LED state
            this.neoPixelController.switchToState(req.body.ledState, { color: NeoPixelController.hsvToHex(req.body.hue, req.body.saturation, req.body.val) });
            res.send("LED state changed successfully");
        });
    }
}