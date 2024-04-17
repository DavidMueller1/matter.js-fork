import { Logger } from "@project-chip/matter-node.js/log";

import express, { Application, Request, Response } from "express";
import PrivacyhubNode, { knownTypes } from "../matter/PrivacyhubNode.js";
import { stringifyIgnoreCircular, stringifyWithBigint } from "../util/Util.js";
import NeoPixelController, { LedState } from "../util/NeoPixelController.js";
import cors from 'cors';
import { NodeId, ClusterId, EndpointNumber } from "@project-chip/matter.js/datatype";
import { OnOffCluster } from "@project-chip/matter.js/cluster";
import { Server } from "socket.io";
import { createServer } from "node:http";
import SocketServer from "../websocket/SocketServer.js";
// import { OnOffCluster } from "@project-chip/matter.js/dist/esm/cluster/definitions/index.js";
// import expressJSDocSwagger from "express-jsdoc-swagger";

import dotenv from "dotenv";
import BaseDevice from "../matter/devices/BaseDevice.js";
import { CommissioningController } from "@project-chip/matter.js";
import OnOffPluginUnit from "../matter/devices/OnOffPluginUnit.js";
import DeviceManager from "../matter/devices/DeviceManager.js";
dotenv.config();

const threadNetworkName = process.env.THREAD_NETWORK_NAME || "GuguGaga";
const threadNetworkOperationalDataset = process.env.THREAD_NETWORK_OPERATIONAL_DATASET || "";

const WEBSOCKET_CORS = {
    origin: "*",
    methods: ["GET", "POST"]
}

export default class PrivacyhubBackend {
    private readonly app: Application;
    private readonly httpServer;
    // private readonly socketServer: SocketServer;
    private readonly io;

    private readonly port: number;
    private readonly logger: Logger;

    private readonly privacyhubNode: PrivacyhubNode;
    private readonly commissioningController: CommissioningController;
    private readonly neoPixelController: NeoPixelController;

    private readonly deviceManager: DeviceManager;

    constructor(privacyhubNode: PrivacyhubNode, commissioningController: CommissioningController) {
        this.logger = Logger.get("PrivacyhubBackend");
        this.logger.info("Starting Privacyhub backend...")

        // Setup NeoPixelController
        this.neoPixelController = new NeoPixelController()
        this.neoPixelController.switchToState({
            state: LedState.LOADING,
            color: NeoPixelController.hsvToHex(30, 1, 1)
        });


        // Setup PrivacyhubNode
        this.privacyhubNode = privacyhubNode;
        this.commissioningController = commissioningController;


        // Setup Express
        process.env.PORT ? this.port = parseInt(process.env.PORT) : this.port = 8000;
        this.app = express();
        this.httpServer = createServer(this.app);
        // this.socketServer = new SocketServer(new Server(this.httpServer, {
        //     cors: WEBSOCKET_CORS
        // }));
        this.io = new Server(this.httpServer, {
            cors: WEBSOCKET_CORS
        });
        this.app.use(express.json());
        this.app.use(cors());


        this.setupRoutes();
        // this.setupSwagger();
        this.setupWebSocket();
        // this.setupEventCallbacks().then(() => {
        //     this.logger.info("Event callbacks setup successfully");
        // }).catch((error) => {
        //     this.logger.error(`Error setting up event callbacks: ${error}`);
        // });

        this.httpServer.listen(this.port, () => {
            this.logger.info(`Server is Fire at http://localhost:${this.port}`);
            this.neoPixelController.switchToState({
                state: LedState.BLINKING,
                color: NeoPixelController.hsvToHex(120, 1, 1)
            });
        });

        // Setup devices
        this.deviceManager = DeviceManager.getInstance();
        this.commissioningController.getCommissionedNodes().forEach((nodeId) => {
            this.deviceManager.generateDevices(nodeId, this.commissioningController, this.io).then((devices) => {
                this.logger.info(`Generated ${devices.length} devices for node ${nodeId.toString()}`);
            }).catch((error) => {
                this.logger.error(`Error generating devices: ${error}`);
            });
        });
        // this.app.listen(this.port, () => {
        //     this.logger.info(`Server is Fire at http://localhost:${this.port}`);
        //     this.neoPixelController.switchToState({
        //         state: LedState.BLINKING,
        //         color: NeoPixelController.hsvToHex(120, 1, 1)
        //     });
        // });
    }

    // private setupEventCallbacks(): Promise<void> {
    //     return new Promise<void>((resolve, reject) => {
    //         this.privacyhubNode.reconnectAllNodes().then((connectedNodes) => {
    //             for (const node of connectedNodes) {
    //                 // Subscribe to all events
    //                 node.getDevices().forEach((device) => {
    //                     const types = device.getDeviceTypes();
    //                     const deviceType = types[0].code;
    //                     // Check if the device type is a key of knownTypes
    //                     if (!knownTypes[deviceType]) {
    //                         this.logger.warn(`Unknown device type: ${deviceType}`);
    //                     } else {
    //                         switch (deviceType) {
    //                             case 266:
    //                                 // OnOffPluginUnit
    //                                 const onOffCluster = device.getClusterClient(OnOffCluster);
    //
    //                                 if (onOffCluster !== undefined) {
    //                                     onOffCluster.subscribeOnOffAttribute((state) => {
    //                                         this.logger.info(`OnOff state changed to ${state}`);
    //                                         this.io.emit('onOffState', {
    //                                             nodeId: node.nodeId.toString(),
    //                                             state: state
    //                                         });
    //                                     }, 1, 10).then(() => {
    //                                         this.logger.debug(`Subscribed to OnOff attribute`);
    //                                         resolve();
    //                                     }).catch((error) => {
    //                                         this.logger.error(`Failed to subscribe to OnOff attribute: ${error}`);
    //                                         reject();
    //                                     });
    //                                 } else {
    //                                     this.logger.error(`Device does not have OnOff cluster`);
    //                                     reject();
    //                                 }
    //                                 break;
    //                         }
    //                     }
    //                 });
    //                 // const interactionClient = await node.getInteractionClient();
    //                 // console.log(`Node ${node.nodeId}: ${interactionClient}`);
    //                 // const attributesAndEvents = await interactionClient.getAllAttributesAndEvents();
    //                 // console.log(`Attributes and events: ${stringifyWithBigint(attributesAndEvents)}`);
    //             }
    //         }).catch((error) => {
    //             reject(error);
    //         });
    //     });
    // }

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


        this.app.post('/pairing/ble-thread', (req: Request, res: Response) => {
            // Log JSON body
            this.logger.info("Received BLE Thread pairing request:");
            this.logger.info(JSON.stringify(req.body, null, 2));

            // Check if the request body has the required fields
            if (!req.body.pairingCode) {
                res.status(400).send(JSON.stringify({
                    message: "Missing required field 'pairingCode'"
                }));
                return;
            }
            this.neoPixelController.switchToState({
                state: LedState.LOADING,
                color: NeoPixelController.hsvToHex(235, 1, 1)
            });

            this.privacyhubNode.commissionNodeBLEThread(
                req.body.pairingCode,
                threadNetworkName,
                threadNetworkOperationalDataset
            ).then((node) => {
                this.deviceManager.generateDevices(node.nodeId, this.commissioningController, this.io).then((devices) => {
                    this.logger.info(`Generated ${devices.length} devices for node ${node.nodeId.toString()}`);
                    this.neoPixelController.switchToState({
                        state: LedState.BLINKING,
                        color: NeoPixelController.hsvToHex(120, 1, 1)
                    });

                    res.status(201).send(JSON.stringify({
                        nodeId: node.nodeId
                    }));
                }).catch((error) => {
                    this.logger.error(`Error generating devices: ${error}`);
                });


            }).catch((error) => {
                this.neoPixelController.switchToState({
                    state: LedState.BLINKING,
                    color: NeoPixelController.hsvToHex(0, 1, 1)
                });
                res.status(500).send(`Error commissioning node: ${error}`);
            });
        });


        /**
         * @api {get} /nodes List Nodes
         * @apiName List Nodes
         * @apiGroup Nodes
         *
         * @apiSuccess {Object[]} nodes List of nodes
         */
        this.app.get('/nodes', (_, res: Response) => {
            this.privacyhubNode.getCommissionedNodes().then((nodes) => {
                res.send(stringifyWithBigint(nodes));
            }).catch((error) => {
                res.status(500).send(`Error getting nodes: ${error}`);
            });
        });


        this.app.get('/nodes/:nodeId', (req: Request, res: Response) => {
            const nodeId = NodeId(BigInt(req.params.nodeId));
            this.privacyhubNode.connectToNode(nodeId).then((_) => {
                res.send("Connected to node successfully");
            }).catch((error) => {
                res.status(500).send(`Error connecting to node: ${error}`);
            });
        });


        this.app.post('/nodes/:nodeId/:endpointId/onOff', (req: Request, res: Response) => {
            this.logger.info("Received OnOff state change request:");
            console.log(req.params)
            let toggle = false;
            let newState = false;

            const nodeId = NodeId(BigInt(req.params.nodeId));
            const endpointId = EndpointNumber(Number(req.params.endpointId));

            if (!req.body.state) {
                toggle = true;
            } else {
                newState = req.body.state;
            }

            const device = this.deviceManager.getDevice(nodeId, endpointId);
            if (!device) {
                res.status(500).send(`Device not found`);
                return;
            }

            if (device instanceof OnOffPluginUnit) {
                device.switchOnOff(newState, toggle).then(() => {
                    res.send("Set state successfully");
                }).catch((error) => {
                    res.status(500).send(`Error setting state: ${error}`);
                });
            } else {
                res.status(500).send(`Device is not an OnOffPluginUnit`);
            }
        });


        this.app.get('/nodes/:nodeId/:endpointId/onOff', (req: Request, res: Response) => {
            const nodeId = NodeId(BigInt(req.params.nodeId));
            const endpointId = EndpointNumber(Number(req.params.endpointId));

            const device = this.deviceManager.getDevice(nodeId, endpointId);
            if (!device) {
                res.status(500).send(`Device not found`);
                return;
            }

            if (device instanceof OnOffPluginUnit) {
                res.send(JSON.stringify({
                    state: device.onOffState
                }));
            } else {
                res.status(500).send(`Device is not an OnOffPluginUnit`);
            }
        });

        this.app.get('/nodes/:nodeId/:endpointId/history', (req: Request, res: Response) => {
            const nodeId = NodeId(BigInt(req.params.nodeId));
            const endpointId = EndpointNumber(Number(req.params.endpointId));

            const from = req.query.from ? parseInt(req.query.from as string) : 0;
            const to = req.query.to ? parseInt(req.query.to as string) : Date.now();

            const device = this.deviceManager.getDevice(nodeId, endpointId);
            if (!device) {
                res.status(500).send(`Device not found`);
                return;
            }

            device.getHistory(0, Date.now()).then((history) => {
                res.send(JSON.stringify(history));
            }).catch((error) => {
                res.status(500).send(`Error getting history: ${error}`);
            });
        });


        this.app.get('/nodes/:nodeId/debug', (req: Request, res: Response) => {
            const nodeId = NodeId(BigInt(req.params.nodeId));
            this.privacyhubNode.connectToNode(nodeId).then((node) => {
                const devices = node.getDevices();
                const endpoints = [];
                for (const device of devices) {
                    const deviceTypes = device.getDeviceTypes()
                    // const clusterServer = device.getClusterServerById(ClusterId(6));
                    this.logger.info(`Device ${device.name}: ${stringifyIgnoreCircular(deviceTypes)}`);
                    endpoints.push(deviceTypes);
                }
                res.send(stringifyIgnoreCircular(endpoints));
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

    private setupWebSocket(): void {
        this.io.on('connection', (socket) => {
            this.logger.info('a user connected');
            socket.on('disconnect', () => {
                this.logger.info('user disconnected');
            });
        });
    }
}