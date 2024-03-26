import { Logger } from "@project-chip/matter-node.js/log";

import express, { Application, Request, Response } from "express";
import PrivacyhubNode from "../matter/PrivacyhubNode.js";
import { stringifyIgnoreCircular, stringifyWithBigint } from "../util/Util.js";
import NeoPixelController, { LedState } from "../util/NeoPixelController.js";
import cors from 'cors';
import { NodeId } from "@project-chip/matter.js/datatype";
// import expressJSDocSwagger from "express-jsdoc-swagger";

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
        // this.setupSwagger();
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
        this.app.use(cors());
    }

    // private setupSwagger(): void {
    //     const options = {
    //         info: {
    //             version: '1.0.0',
    //             title: 'Privacyhub Backend',
    //             license: {
    //                 name: 'MIT',
    //             },
    //         },
    //         // security: {
    //         //     BasicAuth: {
    //         //         type: 'http',
    //         //         scheme: 'basic',
    //         //     },
    //         // },
    //         // Base directory which we use to locate your JSDOC files
    //         baseDir: "./",
    //         // Glob pattern to find your jsdoc files (multiple patterns can be added in an array)
    //         filesPattern: './**/*.ts',
    //         // URL where SwaggerUI will be rendered
    //         swaggerUIPath: '/api-docs',
    //         // Expose OpenAPI UI
    //         exposeSwaggerUI: true,
    //         // Expose Open API JSON Docs documentation in `apiDocsPath` path.
    //         exposeApiDocs: false,
    //         // Open API JSON Docs endpoint.
    //         apiDocsPath: '/v3/api-docs',
    //         // Set non-required fields as nullable by default
    //         notRequiredAsNullable: false,
    //         // You can customize your UI options.
    //         // you can extend swagger-ui-express config. You can checkout an example of this
    //         // in the `example/configuration/swaggerOptions.js`
    //         swaggerUiOptions: {},
    //         // multiple option in case you want more that one instance
    //         multiple: true,
    //     };
    //
    //     expressJSDocSwagger(this.app)(options);
    // }

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
            this.logger.debug(`Sending nodes list: ${stringifyWithBigint(nodeList)}`);
            const response = {
                nodes: nodeList.map(node => {
                    return {
                        nodeId: node.nodeId,
                        vendor: node.basicInformationData?.vendorName,
                        product: node.basicInformationData?.productName,
                    }
                })
            }
            res.send(stringifyWithBigint(response));
        });

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

        this.app.get('/nodes/:nodeId', (req: Request, res: Response) => {
            const nodeId = NodeId(BigInt(req.params.nodeId));
            this.privacyhubNode.connectToNode(nodeId).then(() => {
                res.send("Connected to node successfully");
            }).catch((error) => {
                res.status(500).send(`Error connecting to node: ${error}`);
            });
        });

        this.app.get('/nodes/:nodeId/attributes', (req: Request, res: Response) => {
            const nodeId = NodeId(BigInt(req.params.nodeId));
            this.privacyhubNode.connectToNode(nodeId).then((node) => {
                node.getInteractionClient().then((interactionClient) => {
                    interactionClient.getAllAttributesAndEvents().then((attributesAndEvents) => {
                        res.send(stringifyIgnoreCircular(attributesAndEvents));
                    }).catch((error) => {
                        res.status(500).send(`Error getting attributes and events: ${error}`);
                    });
                }).catch((error) => {
                    res.status(500).send(`Error getting interaction client: ${error}`);
                });
            }).catch((error) => {
                res.status(500).send(`Error connecting to node: ${error}`);
                throw error;
            });
        });

        /**
         * Color HSV
         * @typedef {object} ColorHSV
         * @property {number} hue.required - Hue value - eg: 120
         * @property {number} saturation.required - Saturation value - eg: 1
         * @property {number} value.required - Value value - eg: 1
         */

        /**
         * Led State options
         * @typedef {object} LedOptions
         * @property {string} ledState.required - State of the LED ring - enum:OFF,SINGLE,LOADING,BLINKING,PULSING
         * @property {ColorHSV} colorHsv.required - HSV color
         * @property {number} loadingTailLength - Length of the loading tail - eg: 12
         * @property {number} loadingRotationDuration - Duration of the loading rotation - eg: 1000
         * @property {number} blinkDuration - Duration of the blinks - eg: 500
         * @property {number} blinkCount - Number of blinks - eg: 2
         * @property {number} pulsingDuration - Duration of the pulsing - eg: 1000
         * @property {number} pulsingSecondColor - Second color of the pulsing - eg: 0x00FF00
         * @property {number} fadeDuration - Duration of the fade - eg: 1000
         */

        /**
         * POST /debug/led/state
         * @param {LedOptions} request.body.required - Led state options - application/json
         * @return {string} 200 - Status changed
         */
        this.app.post('/debug/led/state', (req: Request, res: Response) => {
            // Log JSON body
            this.logger.info("Received LED state change request:");
            this.logger.info(JSON.stringify(req.body, null, 2));

            // Get LedState enum from ledState string
            const targetState: LedState = LedState[req.body.ledState as keyof typeof LedState];
            const color = NeoPixelController.hsvToHex(req.body.colorHsv.hue, req.body.colorHsv.saturation, req.body.colorHsv.value);
            const options = {
                state: targetState,
                color: color,
                loadingTailLength: req.body.loadingTailLength,
                loadingRotationDuration: req.body.loadingRotationDuration,
                blinkDuration: req.body.blinkDuration,
                blinkCount: req.body.blinkCount,
                pulsingDuration: req.body.pulsingDuration,
                pulsingSecondColor: req.body.pulsingSecondColor,
                fadeDuration: req.body.fadeDuration
            }

            // Set LED state
            this.neoPixelController.switchToState(options);
            res.send("LED state changed successfully");
        });
    }
}