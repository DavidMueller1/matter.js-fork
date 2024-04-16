import { PairedNode, Endpoint, NodeStateInformation } from "@project-chip/matter-node.js/device";
import BaseDevice from "./BaseDevice.js";
import { OnOffCluster } from "@project-chip/matter.js/cluster";
import { Logger } from "@project-chip/matter-node.js/log";
import { CommissioningController } from "@project-chip/matter.js";
import { Server } from "socket.io";
import { NodeId, EndpointNumber } from "@project-chip/matter.js/datatype";

export default class OnOffPluginUnit extends BaseDevice {
    private _onOffState: boolean = false;

    constructor(
        uniqueId: string,
        nodeId: NodeId,
        endpointId: EndpointNumber,
        pairedNode: PairedNode,
        endpoint: Endpoint,
        commissioningController: CommissioningController,
        io: Server,
        stateInformationCallback?: (peerNodeId: NodeId, state: NodeStateInformation) => void
    ) {
        super(uniqueId, nodeId, endpointId, pairedNode, endpoint, commissioningController, io, stateInformationCallback);
        this.logger = Logger.get("OnOffPluginUnit");
    }

    override setBaseDevice() {
        this.isBaseDevice = false;
    }

    override initialize(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            super.initialize().then(() => {
                // Subscribe to OnOff attribute
                const onOffCluster = this.endpoint.getClusterClient(OnOffCluster);
                if (onOffCluster !== undefined) {
                    onOffCluster.subscribeOnOffAttribute((state) => {
                        this._onOffState = state;
                        this.logger.info(`OnOff state changed to ${this._onOffState}`);
                        this.io.emit('onOffState', {
                            nodeId: this.nodeId.toString(),
                            endpointId: this.endpointId.toString(),
                            state: this._onOffState
                        });
                    }, 1, 10).then(() => {
                        this.logger.debug(`Subscribed to OnOff attribute`);
                        resolve();
                    }).catch((error) => {
                        this.logger.error(`Failed to subscribe to OnOff attribute: ${error}`);
                        reject();
                    });
                } else {
                    this.logger.error(`Device does not have OnOff cluster`);
                    reject();
                }
            }).catch((error) => {
                reject(error);
            });
        });
    }

    switchOnOff(state: boolean, toggle = false): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const onOffCluster = this.endpoint.getClusterClient(OnOffCluster);
            if (onOffCluster !== undefined) {
                if (toggle) {
                    onOffCluster.toggle().then(() => {
                        resolve();
                    }).catch((error) => {
                        this.logger.error(`Failed to toggle OnOff: ${error}`);
                        reject(error);
                    });
                } else {
                    (state ? onOffCluster.on() : onOffCluster.off()).then(() => {
                        resolve();
                    }).catch((error) => {
                        this.logger.error(`Failed to set OnOff: ${error}`);
                        reject(error);
                    });
                }
            }
        });
    }

    get onOffState(): boolean {
        return this._onOffState;
    }
}