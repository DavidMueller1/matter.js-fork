import PrivacyhubBackend from "./express/PrivacyhubBackend.js";
import { Format, Level, Logger } from "@project-chip/matter-node.js/log";
import { BleNode } from "@project-chip/matter-node-ble.js/ble";
import { Ble } from "@project-chip/matter-node.js/ble";
import { requireMinNodeVersion, singleton } from "@project-chip/matter-node.js/util";

import dotenv from "dotenv";
import PrivacyhubNode from "./matter/PrivacyhubNode.js";
import NeoPixelController, { LedState } from "./util/NeoPixelController.js";
import { stringifyWithBigint } from "./util/Util.js";
import DbController from "./db/DbController.js";

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

const dbController = new DbController(process.env.MONGO_URI);
await dbController.connect();

// const privacyhubNode = new PrivacyhubNode();
// await privacyhubNode.start();
// const connectedNodes = await privacyhubNode.reconnectAllNodes();
// // // console.log(`Connected to ${connectedNodes.length} nodes`);
// // // console.log("=====================================");
// // for (const node of connectedNodes) {
// //     // Subscribe to all events
// //     node.getDevices().forEach((device) => {
// //
// //     });
// //     // const interactionClient = await node.getInteractionClient();
// //     // console.log(`Node ${node.nodeId}: ${interactionClient}`);
// //     // const attributesAndEvents = await interactionClient.getAllAttributesAndEvents();
// //     // console.log(`Attributes and events: ${stringifyWithBigint(attributesAndEvents)}`);
// // }
//
// new PrivacyhubBackend(privacyhubNode);