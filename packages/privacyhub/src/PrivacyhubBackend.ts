import { Logger } from "@project-chip/matter-node.js/log";

import express, { Application, Request, Response } from "express";
import PrivacyhubNode from "./PrivacyhubNode.js";
import { stringifyWithBigint } from "./Util.js";
import NeoPixelController, { LedState } from "./NeoPixelController.js";

import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import swaggerExpressValidator from "swagger-express-validator";
import { ledStateSchema } from "./RequestBodySchemas.js";

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

        this.setupExpress();
        this.setupRoutes();
        this.setupSwagger();
        this.app.listen(this.port, () => {
            this.logger.info(`Server is Fire at http://localhost:${this.port}`);
            this.neoPixelController.switchToState({
                state: LedState.BLINKING,
                color: NeoPixelController.hsvToHex(120, 1, 1)
            });
        });
    }

    private setupExpress(): void {
        this.app.use(express.json());
    }

    private setupSwagger(): void {
        const swaggerOptions = {
            swaggerDefinition: {
                openapi: '3.0.0',
                info: {
                    title: 'Express API with Swagger',
                    version: '1.0.0',
                    description: 'API documentation generated with Swagger',
                },
                servers: [{ url: 'http://localhost:8000' }],
            },
            apis: ['PrivacyhubBackend.js'], // Specify the file containing your routes
        };
        const specs = swaggerJsdoc(swaggerOptions);
        this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
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
            this.neoPixelController.switchToState({
                state: LedState.LOADING,
                color: NeoPixelController.hsvToHex(235, 1, 1)
            });

            this.privacyhubNode.commissionNodeBLEThread(
                req.body.pairingCode,
                req.body.threadNetworkName,
                req.body.threadNetworkOperationalDataset
            ).then(() => {
                this.neoPixelController.switchToState({
                    state: LedState.BLINKING,
                    color: NeoPixelController.hsvToHex(120, 1, 1)
                });
                res.send("Commissioned node successfully");
            }).catch((error) => {
                this.neoPixelController.switchToState({
                    state: LedState.BLINKING,
                    color: NeoPixelController.hsvToHex(0, 1, 1)
                });
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
        this.app.post('/debug/led/state', [
            swaggerExpressValidator.validate(ledStateSchema),
            (req: Request, res: Response) => {
                // Log JSON body
                this.logger.info("Received LED state change request:");
                this.logger.info(JSON.stringify(req.body, null, 2));

                if (!req.body.ledState) {
                    res.status(400).send("Missing required fields. Needed: {options: {state: string, hue: number, saturation: number, value: number}}");
                    return;
                }

                // Get LedState enum from ledState string
                const targetState: LedState = LedState[req.body.ledState as keyof typeof LedState];

                if (targetState == undefined) {
                    res.status(400).send("Invalid LED state");
                    return;
                }

                // const hsvColor =

                // Check if the request body has the required fields
                if (!req.body.ledState || req.body.hue == undefined || req.body.saturation == undefined || req.body.val == undefined) {
                    res.status(400).send("Missing required fields. Needed: {state: string, hue: number, saturation: number, value: number}");
                    return;
                }



                // Set LED state
                this.neoPixelController.switchToState({
                    state: targetState,
                    color: NeoPixelController.hsvToHex(req.body.hue, req.body.saturation, req.body.val)
                });
                res.send("LED state changed successfully");
            }
        ]);
    }
}