import { Logger } from "@project-chip/matter-node.js/log";

import express, { Application, Request, Response } from "express";
import PrivacyhubNode from "./PrivacyhubNode.js";
import { stringifyWithBigint } from "./Util.js";
import NeoPixelController, { LedState } from "./NeoPixelController.js";
import expressJSDocSwagger from "express-jsdoc-swagger";

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
        const options = {
            info: {
                version: '1.0.0',
                title: 'Privacyhub Backend',
                license: {
                    name: 'MIT',
                },
            },
            // security: {
            //     BasicAuth: {
            //         type: 'http',
            //         scheme: 'basic',
            //     },
            // },
            // Base directory which we use to locate your JSDOC files
            baseDir: "./",
            // Glob pattern to find your jsdoc files (multiple patterns can be added in an array)
            filesPattern: './**/*.ts',
            // URL where SwaggerUI will be rendered
            swaggerUIPath: '/api-docs',
            // Expose OpenAPI UI
            exposeSwaggerUI: true,
            // Expose Open API JSON Docs documentation in `apiDocsPath` path.
            exposeApiDocs: false,
            // Open API JSON Docs endpoint.
            apiDocsPath: '/v3/api-docs',
            // Set non-required fields as nullable by default
            notRequiredAsNullable: false,
            // You can customize your UI options.
            // you can extend swagger-ui-express config. You can checkout an example of this
            // in the `example/configuration/swaggerOptions.js`
            swaggerUiOptions: {},
            // multiple option in case you want more that one instance
            multiple: true,
        };

        expressJSDocSwagger(this.app)(options);
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
         * Led State options
         * @typedef {object} LedOptions
         * @property {string} ledState.required - State of the LED ring - enum:OFF,SINGLE,LOADING,BLINKING,PULSING
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
        });
    }
}