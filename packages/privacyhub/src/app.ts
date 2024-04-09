import dotenv from "dotenv";
dotenv.config();

import PrivacyhubBackend from "./express/PrivacyhubBackend.js";
import { Format, Level, Logger } from "@project-chip/matter-node.js/log";
import { BleNode } from "@project-chip/matter-node-ble.js/ble";
import { Ble } from "@project-chip/matter-node.js/ble";
import { requireMinNodeVersion, singleton } from "@project-chip/matter-node.js/util";
import {
    BasicInformationCluster,
    DescriptorCluster,
    GeneralCommissioning,
    OnOffCluster,
} from "@project-chip/matter-node.js/cluster";

import PrivacyhubNode from "./matter/PrivacyhubNode.js";
import NeoPixelController, { LedState } from "./util/NeoPixelController.js";
import { stringifyWithBigint } from "./util/Util.js";
import DbController from "./db/DbController.js";


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

// const neoPixelController = new NeoPixelController()
// neoPixelController.switchToState({
//     state: LedState.LOADING,
//     color: NeoPixelController.hsvToHex(30, 1, 1)
// });

// Initialize BLE
Ble.get = singleton(
    () =>
        new BleNode({
            hciId: parseInt(process.env.HCI_ID || "0"),
        }),
);

// Setup DbController
if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI environment variable is not set");
}

const logger = Logger.get("app");

const dbController = new DbController(process.env.MONGO_URI);
await dbController.connect();

const privacyhubNode = new PrivacyhubNode();
await privacyhubNode.start();
// try {
//     const connectedNodes = await privacyhubNode.reconnectAllNodes();
//     logger.info(`Connected to ${connectedNodes.length} nodes`);
//     logger.info("=====================================");
//     for (const node of connectedNodes) {
//         const devices = node.getDevices();
//         logger.info(`Node ${node.nodeId} has ${devices.length} devices`);
//         devices.forEach((device) => {
//             const uniqueID = device.determineUniqueID();
//             logger.info(`Device ${device.id} of node ${node.nodeId} has unique ID ${uniqueID}`);
//         });
//         const basicInformation = node.getRootClusterClient(BasicInformationCluster);
//         if (basicInformation !== undefined) {
//             const vendorName = await basicInformation.attributes.vendorName.get();
//             const productName = await basicInformation.attributes.productName.get();
//             const uniqueId = await basicInformation.attributes.uniqueId.get();
//             // Log all together
//             logger.info(`Basic Information: ${vendorName} -- ${productName} -- ${uniqueId}`);
//         }
//         // const descriptor = node.getRootClusterClient(DescriptorCluster);
//         // if (descriptor !== undefined) {
//         //     logger.info("STUFF ====================================================================================================");
//         //     const deviceTypeList = await descriptor.attributes.deviceTypeList.get();
//         //     logger.info(`Device Type List:`);
//         //     console.log(deviceTypeList);
//         //     const parts = await descriptor.attributes.partsList.get();
//         //     logger.info(`Parts List:`);
//         //     console.log(parts);
//         //     // logger.info(await descriptor.attributes.deviceTypeList.get()); // you can call that way
//         //     logger.info(await descriptor.getServerListAttribute()); // or more convenient that way
//         // } else {
//         //     logger.error("No Descriptor Cluster found. This should never happen!");
//         // }
//
//         // const interactionClient = await node.getInteractionClient();
//         // console.log(`Node ${node.nodeId}: ${interactionClient}`);
//         // const attributesAndEvents = await interactionClient.getAllAttributesAndEvents();
//         // console.log(`Attributes and events: ${stringifyWithBigint(attributesAndEvents)}`);
//     }
// } catch (error) {
//     logger.error(`Failed to reconnect to nodes: ${error}`);
// }

new PrivacyhubBackend(privacyhubNode);