import { CommissioningController, MatterServer, NodeCommissioningOptions } from "@project-chip/matter-node.js";

import { BleNode } from "@project-chip/matter-node-ble.js/ble";
import { Ble } from "@project-chip/matter-node.js/ble";
import {
    BasicInformationCluster,
    DescriptorCluster,
    GeneralCommissioning,
    OnOffCluster,
} from "@project-chip/matter-node.js/cluster";
import { NodeId } from "@project-chip/matter-node.js/datatype";
import { NodeStateInformation } from "@project-chip/matter-node.js/device";
import { Format, Level, Logger } from "@project-chip/matter-node.js/log";
import { CommissioningOptions } from "@project-chip/matter-node.js/protocol";
import { ManualPairingCodeCodec } from "@project-chip/matter-node.js/schema";
import { StorageBackendDisk, StorageManager } from "@project-chip/matter-node.js/storage";
import {
    getIntParameter,
    getParameter,
    hasParameter,
    requireMinNodeVersion,
    singleton,
} from "@project-chip/matter-node.js/util";

import express, { Application, Request, Response } from "express";
import dotenv from "dotenv";

// Get the environment variables from the .env file
dotenv.config()

requireMinNodeVersion(16);

// Configure logging
switch (process.env.LOG_LEVEL || "debug") {
    case "fatal":
        Logger.defaultLogLevel = Level.FATAL;
        break;
    case "error":
        Logger.defaultLogLevel = Level.ERROR;
        break;
    case "debug":
        Logger.defaultLogLevel = Level.DEBUG;
        break;
    case "warn":
        Logger.defaultLogLevel = Level.WARN;
        break;
    case "info":
        Logger.defaultLogLevel = Level.INFO;
        break;
    default:
        Logger.defaultLogLevel = Level.DEBUG;
        break;
}

switch (process.env.LOG_FORMAT || "plain") {
    case "plain":
        Logger.format = Format.PLAIN;
        break;
    case "html":
        Logger.format = Format.HTML;
        break;
    case "ansi":
        if (process.stdin?.isTTY) Logger.format = Format.ANSI;
        break;
    default:
        if (process.stdin?.isTTY) Logger.format = Format.ANSI;
}

const logger = Logger.get("PrivacyhubBackend")

const app: Application = express();
const backend_port = process.env.PORT || 8000;

app.use(express.json());


// Use storage for now. TODO: Remove later and replace with something else maybe
const storageLocation = process.env.STORAGE_LOCATION || ".privacyhub-storage-dafault";
const storage = new StorageBackendDisk(storageLocation, false);
logger.info(`Storage location: ${storageLocation} (Directory)`);

const storageManager = new StorageManager(storage);
await storageManager.initialize();

const controllerStorage = storageManager.createContext("Controller");
const ip = controllerStorage.has("ip") ? controllerStorage.get<string>("ip") : undefined;
const port = controllerStorage.has("port") ? controllerStorage.get<number>("port") : undefined;


// Initialize BLE
Ble.get = singleton(
    () =>
        new BleNode({
            hciId: parseInt(process.env.HCI_ID || "0"),
        }),
);

// Initialize Matter server
const initMatterServer = (): Promise<void> => {
    const matterServer = new MatterServer(storageManager);
    const commissioningController = new CommissioningController({
        autoConnect: false,
    });
    matterServer.addCommissioningController(commissioningController).then(() => {
        matterServer.start().then(() => {

        }).catch((error) => { // Error starting matter server

        });
    }).catch((error) => { // Error adding commissioning controller

    });
}

app.get('/', (_, res: Response) => {
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
app.post('/pairing/ble-thread', (req: Request, res: Response) => {
    // Log JSON body
    logger.info("Received BLE Thread pairing request:");
    logger.info(JSON.stringify(req.body, null, 2));

    // Check if the request body has the required fields
    if (!req.body.pairingCode || !req.body.threadNetworkName || !req.body.threadNetworkOperationalDataset) {
        res.status(400).send("Missing required fields. Needed: {pairingCode: number, threadNetworkName: string, threadNetworkOperationalDataset: string}");
        return;
    }

    const responseJson = req.body

    // Extract data from pairing code
    const pairingCode = req.body.pairingCode;
    const pairingCodeCodec = ManualPairingCodeCodec.decode(pairingCode);
    const shortDiscriminator = pairingCodeCodec.shortDiscriminator;
    const longDiscriminator = undefined;
    const setupPin = pairingCodeCodec.passcode;
    logger.debug(`Data extracted from pairing code: ${Logger.toJSON(pairingCodeCodec)}`);

    // Add extracted data to the response JSON
    responseJson.extractedFromPairingCode = pairingCodeCodec;

    // Collect commissionning options
    const commissioningOptions: CommissioningOptions = {
        regulatoryLocation: GeneralCommissioning.RegulatoryLocationType.IndoorOutdoor,
        regulatoryCountryCode: "XX",
    };

    commissioningOptions.threadNetwork = {
        networkName: req.body.threadNetworkName,
        operationalDataset: req.body.threadNetworkOperationalDataset,
    }

    // Configure and start matter server
    const matterServer = new MatterServer(storageManager);
    const commissioningController = new CommissioningController({
        autoConnect: false,
    });
    matterServer.addCommissioningController(commissioningController).then(() => {
        matterServer.start().then(() => {
            logger.info("Matter server started successfully");


            const ble = true
            const options = {
                commissioning: commissioningOptions,
                discovery: {
                    // knownAddress: ip !== undefined && port !== undefined ? { ip, port, type: "udp" } : undefined,
                    knownAddress: undefined,
                    identifierData:
                        longDiscriminator !== undefined
                            ? { longDiscriminator }
                            : shortDiscriminator !== undefined
                                ? { shortDiscriminator }
                                : {},
                    discoveryCapabilities: {
                        ble,
                    },
                },
                passcode: setupPin,
            } as NodeCommissioningOptions;
            logger.info(`Commissioning ...`);
            logger.info(JSON.stringify(options));
            commissioningController.commissionNode(options).then((pairedNode) => {
                logger.info(`Commissioning successfully done with nodeId ${pairedNode.nodeId}`);

                // Send back JSON body
                res.json(responseJson);
            }).catch((error) => {
                logger.error(`Error commissioning node: ${error}`);
                res.status(500).send("Error commissioning node");
                throw error;
            })

        }).catch((error) => {
            logger.error(`Error starting matter server: ${error}`);
            res.status(500).send("Error starting matter server");
            throw error;
        });
    }).catch((error) => {
        logger.error(`Error adding commissioning controller: ${error}`);
        res.status(500).send("Error adding commissioning controller");
    });
});

app.listen(backend_port, () => {
    logger.info(`Server is Fire at http://localhost:${backend_port}`);
});