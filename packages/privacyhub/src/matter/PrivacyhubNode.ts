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
import { stringifyWithBigint } from "../util/Util.js";

export default class PrivacyhubNode {
    private readonly logger: Logger;
    private readonly storage;

    private matterServer: MatterServer;
    private commissioningController: CommissioningController;

    constructor() {
        this.logger = Logger.get("PrivacyhubNode");

        // Use storage for now. TODO: Remove later and replace with something else maybe
        const storageLocation = process.env.STORAGE_LOCATION || ".privacyhub-storage-dafault";
        this.storage = new StorageBackendDisk(storageLocation, false);
        this.logger.info(`Storage location: ${storageLocation} (Directory)`);
    }

    async start() {
        this.logger.info("Starting PrivacyhubNode...");

        const storageManager = new StorageManager(this.storage);
        await storageManager.initialize();

        const controllerStorage = storageManager.createContext("Controller");
        const ip = controllerStorage.has("ip") ? controllerStorage.get<string>("ip") : undefined;
        const port = controllerStorage.has("port") ? controllerStorage.get<number>("port") : undefined;

        this.matterServer = new MatterServer(storageManager);
        this.commissioningController = new CommissioningController({
            autoConnect: false,
        });

        return new Promise<void>((resolve, reject) => {
            this.matterServer.addCommissioningController(this.commissioningController).then(() => {
                this.logger.info("Commissioning controller added");
                this.matterServer.start().then(() => {
                    this.logger.info("Matter server started");
                    resolve();
                }).catch((error) => { // Error starting matter server
                    this.logger.error(`Error starting matter server: ${error}`);
                    reject(error);
                });
            }).catch((error) => { // Error adding commissioning controller
                this.logger.error(`Error adding commissioning controller: ${error}`);
                reject(error);
            });
        });
    }

    async commissionNodeBLEThread(
        pairingCode: string,
        threadNetworkName: string,
        threadNetworkOperationalDataset: string
    ) {
        return new Promise<void>((resolve, reject) => {
            // Extract data from pairing code
            const pairingCodeCodec = ManualPairingCodeCodec.decode(pairingCode);
            const shortDiscriminator = pairingCodeCodec.shortDiscriminator;
            const longDiscriminator = undefined;
            const setupPin = pairingCodeCodec.passcode;
            this.logger.debug(`Data extracted from pairing code: ${Logger.toJSON(pairingCodeCodec)}`);

            // Collect commissionning options
            const commissioningOptions: CommissioningOptions = {
                regulatoryLocation: GeneralCommissioning.RegulatoryLocationType.IndoorOutdoor,
                regulatoryCountryCode: "XX",
            };

            commissioningOptions.threadNetwork = {
                networkName: threadNetworkName,
                operationalDataset: threadNetworkOperationalDataset,
            }

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
            this.logger.info(`Commissioning ...`);
            this.logger.info(JSON.stringify(options));
            this.commissioningController.commissionNode(options).then((pairedNode) => {
                this.logger.info(`Commissioning successfully done with nodeId ${pairedNode.nodeId}`);
                resolve();
            }).catch((error) => {
                this.logger.error(`Error commissioning node: ${error}`);
                reject(error);
            })
        });
    }

    getCommissionedNodes() {
        const nodes = this.commissioningController.getCommissionedNodesDetails();
        this.logger.debug(`Commissioned nodes: ${stringifyWithBigint(nodes)}`);
        return nodes;
    }

    async reconnectAllNodes() {
        return this.commissioningController.connect();
    }

    connectToNode(nodeId: NodeId): Promise<void> {
        return new Promise( (resolve, reject) => {
            // const node = await this.commissioningController.connectNode(nodeId, {
            this.commissioningController.connectNode(nodeId, {
                attributeChangedCallback: (
                    peerNodeId,
                    { path: { nodeId, clusterId, endpointId, attributeName }, value },
                ) =>
                    console.log(
                        `attributeChangedCallback ${peerNodeId}: Attribute ${nodeId}/${endpointId}/${clusterId}/${attributeName} changed to ${Logger.toJSON(
                            value,
                        )}`,
                    ),
                eventTriggeredCallback: (peerNodeId, { path: { nodeId, clusterId, endpointId, eventName }, events }) =>
                    console.log(
                        `eventTriggeredCallback ${peerNodeId}: Event ${nodeId}/${endpointId}/${clusterId}/${eventName} triggered with ${Logger.toJSON(
                            events,
                        )}`,
                    ),
                stateInformationCallback: (peerNodeId, info) => {
                    switch (info) {
                        case NodeStateInformation.Connected:
                            console.log(`stateInformationCallback ${peerNodeId}: Node ${nodeId} connected`);
                            break;
                        case NodeStateInformation.Disconnected:
                            console.log(`stateInformationCallback ${peerNodeId}: Node ${nodeId} disconnected`);
                            break;
                        case NodeStateInformation.Reconnecting:
                            console.log(`stateInformationCallback ${peerNodeId}: Node ${nodeId} reconnecting`);
                            break;
                        case NodeStateInformation.WaitingForDeviceDiscovery:
                            console.log(
                                `stateInformationCallback ${peerNodeId}: Node ${nodeId} waiting for device discovery`,
                            );
                            break;
                        case NodeStateInformation.StructureChanged:
                            console.log(`stateInformationCallback ${peerNodeId}: Node ${nodeId} structure changed`);
                            break;
                        case NodeStateInformation.Decommissioned:
                            console.log(`stateInformationCallback ${peerNodeId}: Node ${nodeId} decommissioned`);
                            break;
                    }
                },
            }).then((node) => {
                console.log(`Node connected: ${Logger.toJSON(node)}`);
                resolve();
            }).catch((error) => {
                console.log(`Error connecting to node: ${error}`);
                reject(error);
            });
        });

    }
}