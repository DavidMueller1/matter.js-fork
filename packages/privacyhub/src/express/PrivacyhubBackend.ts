import { Logger } from "@project-chip/matter-node.js/log";

import express, { Application, Request, Response } from "express";
import PrivacyhubNode, { knownTypes } from "../matter/PrivacyhubNode.js";
import { stringifyIgnoreCircular, stringifyWithBigint } from "../util/Util.js";
import NeoPixelController, { LedState } from "../util/NeoPixelController.js";
import cors from "cors";
import { EndpointNumber, NodeId } from "@project-chip/matter.js/datatype";
import { Server } from "socket.io";
import { createServer } from "node:http";
// import SocketServer from "../websocket/SocketServer.js";
// import { OnOffCluster } from "@project-chip/matter.js/dist/esm/cluster/definitions/index.js";
// import expressJSDocSwagger from "express-jsdoc-swagger";
import dotenv from "dotenv";
// import BaseDevice from "../matter/devices/BaseDevice.js";
import { CommissioningController } from "@project-chip/matter.js";
import OnOffPluginUnit from "../matter/devices/OnOffPluginUnit.js";
import DeviceManager from "../matter/devices/DeviceManager.js";
import MqttManager from "../mqtt/MqttManager.js";
import os from "os";
import { PrivacyState } from "../matter/devices/BaseDevice.js";
import ExtendedColorLight from "../matter/devices/ExtendedColorLight.js";

const logger = Logger.get("PrivacyhubBackend");

dotenv.config();

if (!process.env.THREAD_NETWORK_NAME) {
    logger.error("Missing required environment variable THREAD_NETWORK_NAME");
    process.exit(1);
}
const THREAD_NETWORK_NAME = process.env.THREAD_NETWORK_NAME;

if (!process.env.THREAD_NETWORK_OPERATIONAL_DATASET) {
    logger.error("Missing required environment variable THREAD_NETWORK_OPERATIONAL_DATASET");
    process.exit(1);
}
const THREAD_NETWORK_OPERATIONAL_DATASET = process.env.THREAD_NETWORK_OPERATIONAL_DATASET;

if (!process.env.WIFI_SSID) {
    logger.error("Missing required environment variable WIFI_SSID");
    process.exit(1);
}
const WIFI_SSID = process.env.WIFI_SSID;

if (!process.env.WIFI_PASSWORD) {
    logger.error("Missing required environment variable WIFI_PASSWORD");
    process.exit(1);
}
const WIFI_PASSWORD = process.env.WIFI_PASSWORD;

export enum AccessLevel {
    PRIVATE,
    PUBLIC,
}

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

    private readonly privacyhubNode: PrivacyhubNode;
    private readonly commissioningController: CommissioningController;
    private readonly neoPixelController: NeoPixelController;

    private readonly deviceManager: DeviceManager;
    private readonly mqttManager: MqttManager;

    constructor(privacyhubNode: PrivacyhubNode, commissioningController: CommissioningController) {
        logger.info("Starting Privacyhub backend...")

        // Setup NeoPixelController
        this.neoPixelController = new NeoPixelController()
        this.neoPixelController.switchToState({
            state: LedState.LOADING,
            color: NeoPixelController.hsvToHex(30, 0.5, 0.6)
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
        //     logger.info("Event callbacks setup successfully");
        // }).catch((error) => {
        //     logger.error(`Error setting up event callbacks: ${error}`);
        // });

        this.httpServer.listen(this.port, () => {
            logger.info(`Server is Fire at http://localhost:${this.port}`);
        });

        // Setup devices
        this.deviceManager = new DeviceManager(this.neoPixelController);

        this.mqttManager = new MqttManager((proxyId, state) => {
            this.deviceManager.setPrivacyStateProxy(proxyId, state);
        });

        const devicePomises: Promise<void>[] = [];
        this.commissioningController.getCommissionedNodes().forEach((nodeId) => {
            const promise = this.deviceManager.generateDevices(nodeId, this.commissioningController, this.io, this.mqttManager).then((devices) => {
                logger.info(`Generated ${devices.length} devices for node ${nodeId.toString()}`);
            }).catch((error) => {
                logger.error(`Error generating devices: ${error}`);
            });
            devicePomises.push(promise);
        });
        Promise.all(devicePomises).then(() => {
            logger.info("Devices generated successfully");
            this.neoPixelController.switchToState({
                state: LedState.BLINKING,
                color: NeoPixelController.hsvToHex(110, 0.9, 0.5),
                blinkDuration: 1000,
                blinkCount: 1,
                fadeDuration: 500
            });
        }).catch((error) => {
            logger.error(`Error generating devices: ${error}`);
        });
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
    //                         logger.warn(`Unknown device type: ${deviceType}`);
    //                     } else {
    //                         switch (deviceType) {
    //                             case 266:
    //                                 // OnOffPluginUnit
    //                                 const onOffCluster = device.getClusterClient(OnOffCluster);
    //
    //                                 if (onOffCluster !== undefined) {
    //                                     onOffCluster.subscribeOnOffAttribute((state) => {
    //                                         logger.info(`OnOff state changed to ${state}`);
    //                                         this.io.emit('onOffState', {
    //                                             nodeId: node.nodeId.toString(),
    //                                             state: state
    //                                         });
    //                                     }, 1, 10).then(() => {
    //                                         logger.debug(`Subscribed to OnOff attribute`);
    //                                         resolve();
    //                                     }).catch((error) => {
    //                                         logger.error(`Failed to subscribe to OnOff attribute: ${error}`);
    //                                         reject();
    //                                     });
    //                                 } else {
    //                                     logger.error(`Device does not have OnOff cluster`);
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
            logger.info("Received BLE Thread pairing request:");
            logger.info(JSON.stringify(req.body, null, 2));

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
                THREAD_NETWORK_NAME,
                THREAD_NETWORK_OPERATIONAL_DATASET
            ).then((node) => {
                this.deviceManager.generateDevices(node.nodeId, this.commissioningController, this.io, this.mqttManager).then((devices) => {
                    logger.info(`Generated ${devices.length} devices for node ${node.nodeId.toString()}`);
                    this.neoPixelController.switchToState({
                        state: LedState.BLINKING,
                        color: NeoPixelController.hsvToHex(120, 1, 1)
                    });

                    res.status(201).send(stringifyWithBigint({
                        nodeId: node.nodeId
                    }));
                }).catch((error) => {
                    logger.error(`Error generating devices: ${error}`);
                });


            }).catch((error) => {
                this.neoPixelController.switchToState({
                    state: LedState.BLINKING,
                    color: NeoPixelController.hsvToHex(0, 1, 1)
                });
                res.status(500).send(`Error commissioning node: ${error}`);
            });
        });

        this.app.post('/pairing/ble-wifi', (req: Request, res: Response) => {
            // Log JSON body
            logger.info("Received BLE WiFi pairing request:");
            logger.info(JSON.stringify(req.body, null, 2));

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

            this.privacyhubNode.commissionNodeBLEWiFi(
                req.body.pairingCode,
                WIFI_SSID,
                WIFI_PASSWORD
            ).then((node) => {
                this.deviceManager.generateDevices(node.nodeId, this.commissioningController, this.io, this.mqttManager).then((devices) => {
                    logger.info(`Generated ${devices.length} devices for node ${node.nodeId.toString()}`);
                    this.neoPixelController.switchToState({
                        state: LedState.BLINKING,
                        color: NeoPixelController.hsvToHex(120, 1, 1)
                    });

                    res.status(201).send(stringifyWithBigint({
                        nodeId: node.nodeId
                    }));
                }).catch((error) => {
                    logger.error(`Error generating devices: ${error}`);
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
        this.app.get('/nodes', (req, res: Response) => {
            // get accessLevel query param
            const accessLevel: AccessLevel = this.checkAccessLevel(req);

            const nodes = this.deviceManager.getDevicesWithAccessLevel(accessLevel).map((device) => {
                return {
                    nodeId: device.nodeId,
                    endpointId: device.endpointId,
                    vendor: device.vendor,
                    product: device.product,
                    type: knownTypes[device.type] ?? "Unknown",
                    manualPairingCode: device.getManualPairingCode(),
                    qrCode: device.getQRCode(),
                    connectionStatus: device.getConnectionStatus(),
                    privacyState: device.getPrivacyState(),
                    connectedProxy: device.getAssignedProxy()
                }
            });
            res.send(stringifyIgnoreCircular(nodes));
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
            logger.info("Received OnOff state change request:");
            console.log(req.params)

            const accessLevel: AccessLevel = this.checkAccessLevel(req);

            let newState = false;

            const nodeId = NodeId(BigInt(req.params.nodeId));
            const endpointId = EndpointNumber(Number(req.params.endpointId));

            if (req.body.state === undefined) {
                res.status(400).send(`Missing required field 'state'`);
                return;
            } else {
                newState = req.body.state;
            }

            const device = this.deviceManager.getDevice(nodeId, endpointId);
            if (!device) {
                res.status(500).send(`Device not found`);
                return;
            }

            if (device instanceof OnOffPluginUnit) {
                if (accessLevel !== AccessLevel.PRIVATE && device.getPrivacyState() < PrivacyState.ONLINE) {
                    res.status(401).send(`Unauthorized`);
                    return;
                }
                device.switchOnOff(newState, true).then(() => {
                    res.send("Set state successfully");
                }).catch((error) => {
                    logger.error(`Error setting state: ${error}`);
                    logger.error(error.stack);
                    res.status(500).send(`Error setting state: ${error}`);
                });
            } else {
                logger.error(`Device is not an OnOffPluginUnit`);
                res.status(500).send(`Device is not an OnOffPluginUnit`);
            }
        });


        this.app.post('/nodes/:nodeId/:endpointId/colorHSV', (req: Request, res: Response) => {
            logger.info("Received colorHSV state change request:");
            console.log(req.params)

            const accessLevel: AccessLevel = this.checkAccessLevel(req);

            const nodeId = NodeId(BigInt(req.params.nodeId));
            const endpointId = EndpointNumber(Number(req.params.endpointId));

            if (
                req.body.hue === undefined ||
                req.body.saturation === undefined ||
                req.body.value === undefined
            ) {
                res.status(400).send(`Missing required fields 'hue', 'saturation' or 'value'`);
                return;
            }

            const hue = req.body.hue;
            const saturation = req.body.saturation;
            const value = req.body.value;

            const device = this.deviceManager.getDevice(nodeId, endpointId);

            if (!device) {
                res.status(500).send(`Device not found`);
                return;
            }

            if (device instanceof ExtendedColorLight) {
                if (accessLevel !== AccessLevel.PRIVATE && device.getPrivacyState() < PrivacyState.ONLINE) {
                    res.status(401).send(`Unauthorized`);
                    return;
                }
                logger.info(`Setting colorHSV to ${hue}, ${saturation}, ${value}`);
                // device.setColorHSV(hue, saturation, value).then(() => {
                //     res.send("Set colorHSV successfully");
                // }).catch((error) => {
                //     logger.error(`Error setting colorHSV: ${error}`);
                //     logger.error(error.stack);
                //     res.status(500).send(`Error setting colorHSV: ${error}`);
                // });
            } else {
                logger.error(`Device is not an ExtendedColorLight`);
                res.status(500).send(`Device is not an ExtendedColorLight`);
            }
        });


        this.app.post('/nodes/:nodeId/:endpointId/lightLevel', (req: Request, res: Response) => {
            logger.info("Received lightLevel state change request:");
            console.log(req.params)

            const accessLevel: AccessLevel = this.checkAccessLevel(req);

            const nodeId = NodeId(BigInt(req.params.nodeId));
            const endpointId = EndpointNumber(Number(req.params.endpointId));

            if (
                req.body.level === undefined
            ) {
                res.status(400).send(`Missing required fields 'level'`);
                return;
            }

            const level = req.body.level;

            const device = this.deviceManager.getDevice(nodeId, endpointId);

            if (!device) {
                res.status(500).send(`Device not found`);
                return;
            }

            if (device instanceof ExtendedColorLight) {
                if (accessLevel !== AccessLevel.PRIVATE && device.getPrivacyState() < PrivacyState.ONLINE) {
                    res.status(401).send(`Unauthorized`);
                    return;
                }
                logger.info(`Setting lightLevel to ${level}`);
                device.setLevel(level).then(() => {
                    logger.info(`Set lightLevel to ${level}`);
                    res.send("Set lightLevel successfully");
                }).catch((error) => {
                    logger.error(`Error setting lightLevel: ${error}`);
                    logger.error(error.stack);
                    res.status(500).send(`Error setting lightLevel: ${error}`);
                });
            } else {
                logger.error(`Device is not an ExtendedColorLight`);
                res.status(500).send(`Device is not an ExtendedColorLight`);
            }
        });


        this.app.get('/nodes/:nodeId/:endpointId/onOff', (req: Request, res: Response) => {
            const accessLevel: AccessLevel = this.checkAccessLevel(req);

            const nodeId = NodeId(BigInt(req.params.nodeId));
            const endpointId = EndpointNumber(Number(req.params.endpointId));

            const device = this.deviceManager.getDevice(nodeId, endpointId);
            if (!device) {
                res.status(500).send(`Device not found`);
                return;
            }

            if (device instanceof OnOffPluginUnit) {
                if (accessLevel !== AccessLevel.PRIVATE && device.getPrivacyState() < PrivacyState.ONLINE) {
                    res.status(401).send(`Unauthorized`);
                    return;
                }
                res.send(JSON.stringify({
                    state: device.onOffState
                }));
            } else {
                res.status(500).send(`Device is not an OnOffPluginUnit`);
            }
        });

        this.app.post('/nodes/:nodeId/:endpointId/connectedProxy', (req: Request, res: Response) => {
            logger.info("Received connected proxy change request:");
            console.log(req.params)
            const connectedProxy = req.body.connectedProxy;

            // TODO: Maybe restrict to local access?

            const nodeId = NodeId(BigInt(req.params.nodeId));
            const endpointId = EndpointNumber(Number(req.params.endpointId));

            this.deviceManager.setConnectedProxy(nodeId, endpointId, connectedProxy).then(() => {
                res.send("Set connected proxy successfully");
                const devicePrivacyState = this.deviceManager.getDevice(nodeId, endpointId)?.getPrivacyState();
                if (devicePrivacyState !== undefined) {
                    this.mqttManager.publishPrivacyStateUpdate(connectedProxy, devicePrivacyState);
                }
            }).catch((error) => {
                res.status(500).send(`Error setting connected proxy: ${error}`);
            });
        });

        this.app.post('/nodes/:nodeId/:endpointId/privacyState', (req: Request, res: Response) => {
            logger.info("Received privacy state change request:");
            console.log(req.params)

            const accessLevel: AccessLevel = this.checkAccessLevel(req);

            const privacyState = req.body.privacyState;

            const nodeId = NodeId(BigInt(req.params.nodeId));
            const endpointId = EndpointNumber(Number(req.params.endpointId));

            const device = this.deviceManager.getDevice(nodeId, endpointId);
            if (!device) {
                res.status(500).send(`Device not found`);
                return;
            }
            if (accessLevel !== AccessLevel.PRIVATE && device.getPrivacyState() < PrivacyState.ONLINE) {
                res.status(401).send(`Unauthorized`);
                return;
            }

            this.deviceManager.setPrivacyState(nodeId, endpointId, privacyState); // TODO: Check if this succeeds
            const assignedProxy = device.getAssignedProxy();
            if (assignedProxy !== 0) {
                this.mqttManager.publishPrivacyStateUpdate(assignedProxy, privacyState);
            }
            res.send("Set privacy state successfully");
        });

        this.app.get('/nodes/:nodeId/:endpointId/history', (req: Request, res: Response) => {
            const nodeId = NodeId(BigInt(req.params.nodeId));
            const endpointId = EndpointNumber(Number(req.params.endpointId));

            const accessLevel: AccessLevel = this.checkAccessLevel(req);
            // if (accessLevel !== AccessLevel.PRIVATE) {
            //     res.status(401).send(`Unauthorized`);
            //     return;
            // }

            // const from = req.query.from ? parseInt(req.query.from as string) : 0;
            // const to = req.query.to ? parseInt(req.query.to as string) : Date.now();

            const device = this.deviceManager.getDevice(nodeId, endpointId);
            if (!device) {
                res.status(500).send(`Device not found`);
                return;
            }

            device.getHistory(0, Date.now(), accessLevel !== AccessLevel.PRIVATE).then((history) => {
                res.send(JSON.stringify(history));
            }).catch((error) => {
                res.status(500).send(`Error getting history: ${error}`);
            });
        });


        this.app.post('/proxy/:proxyId/updatepos', (req: Request, res: Response) => {
            const proxyId = parseInt(req.params.proxyId);

            const row = req.body.row;
            const col = req.body.col;

            logger.info(`Received proxy location update for proxy ${proxyId}: ${row},${col}`);

            if (proxyId > parseInt(process.env.NUM_PROXIES ?? "999")) {
                res.status(400).send(`Invalid proxy id`);
                return;
            }

            if (row === undefined || col === undefined) {
                res.status(400).send(`Missing required fields 'row' or 'col'`);
                return;
            }

            if (row < 1 || row > 16) {
                res.status(400).send(`Invalid row. Must be between 1 and 16`);
                return;
            }

            if (col < 1 || col > 16) {
                res.status(400).send(`Invalid col. Must be between 1 and 16`);
                return;
            }

            this.mqttManager.publishProxyLocationUpdate(proxyId, row, col);
            res.send("Published proxy location update successfully");
        });


        // this.app.get('/nodes/:nodeId/debug', (req: Request, res: Response) => {
        //     const nodeId = NodeId(BigInt(req.params.nodeId));
        //     this.privacyhubNode.connectToNode(nodeId).then((node) => {
        //         const devices = node.getDevices();
        //         const endpoints = [];
        //         for (const device of devices) {
        //             const deviceTypes = device.getDeviceTypes()
        //             // const clusterServer = device.getClusterServerById(ClusterId(6));
        //             logger.info(`Device ${device.name}: ${stringifyIgnoreCircular(deviceTypes)}`);
        //             endpoints.push(deviceTypes);
        //         }
        //         res.send(stringifyIgnoreCircular(endpoints));
        //     }).catch((error) => {
        //         res.status(500).send(`Error connecting to node: ${error}`);
        //         throw error;
        //     });
        // });

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
            logger.info("Received LED state change request:");
            logger.info(JSON.stringify(req.body, null, 2));

            // Get LedState enum from ledState string
            const targetState: LedState = req.body.ledState;
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
            logger.info(`Setting LED state to ${targetState} with color ${color}`);
            logger.info(options);

            // Set LED state
            this.neoPixelController.switchToState(options);
            res.send("LED state changed successfully");
        });
    }

    private setupWebSocket(): void {
        this.io.on('connection', (socket) => {
            const host = socket.handshake.headers.host;
            logger.info(`User connected from ${host}`);

            socket.on('disconnect', (reason) => {
                logger.info(`User disconnected. Reason: ${reason.toString()}`);
            });
        });
    }

    private checkAccessLevel(req: Request): AccessLevel {
        const host = req.get('host');
        if (host === undefined) {
            return AccessLevel.PUBLIC;
        }
        const substrings = host.split(':');
        const ip = substrings[0];
        const addresses = this.getLocalIpAddresses();
        if (addresses.includes(ip)) {
            return AccessLevel.PRIVATE;
        } else {
            return AccessLevel.PUBLIC;
        }
    }

    /**
     * Get local IP addresses of the machine
     * @private
     */
    private getLocalIpAddresses(): string[] {
        const networkInterfaces = os.networkInterfaces();

        const addresses: string[] = [];

        for (const [_, interfaces] of Object.entries(networkInterfaces)) {
            if (interfaces === undefined) {
                continue;
            }
            for (const iface of interfaces) {
                if (iface.family === 'IPv4' && !iface.internal) {
                    addresses.push(iface.address);
                }
            }
        }

        return addresses;
    }
}