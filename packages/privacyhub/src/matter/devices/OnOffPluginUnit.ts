import { PairedNode, Endpoint, NodeStateInformation } from "@project-chip/matter-node.js/device";
import BaseDevice from "./BaseDevice.js";
import { OnOffCluster } from "@project-chip/matter.js/cluster";
import { Logger } from "@project-chip/matter-node.js/log";
import { CommissioningController } from "@project-chip/matter.js";
import { Server } from "socket.io";
import { NodeId, EndpointNumber } from "@project-chip/matter.js/datatype";

export default class OnOffPluginUnit extends BaseDevice {
    // private onOffCallback: (state: boolean) => void;

    constructor(
        nodeId: NodeId,
        endpointId: EndpointNumber,
        pairedNode: PairedNode,
        endpoint: Endpoint,
        commissioningController: CommissioningController,
        io: Server,
        stateInformationCallback?: (peerNodeId: NodeId, state: NodeStateInformation) => void
    ) {
        super(nodeId, endpointId, pairedNode, endpoint, commissioningController, io, stateInformationCallback);
        // this.onOffCallback = onOffCallback;
        this.logger = Logger.get("OnOffPluginUnit");
    }

    override initialize(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            super.initialize().then(() => {
                // Subscribe to OnOff attribute
                const onOffCluster = this.endpoint.getClusterClient(OnOffCluster);
                if (onOffCluster !== undefined) {
                    onOffCluster.subscribeOnOffAttribute((state) => {
                        this.logger.info(`OnOff state changed to ${state}`);
                        this.io.emit('onOffState', {
                            nodeId: this.nodeId.toString(),
                            endpointId: this.endpointId.toString(),
                            state: state
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

                // Subscribe to OnOff command
                this.io.on('onOffCommand', (data) => {
                    if (data.nodeId === this.nodeId.toString() && data.endpointId === this.endpointId.toString()) {
                        let toggle = false;
                        if (data.state === undefined) {
                            toggle = true;
                        }
                        this.switchOnOff(data.state, toggle).then(() => {
                            this.logger.info(`Switched OnOff to ${data.state}`);
                        }).catch(() => {
                            this.logger.error(`Failed to switch OnOff to ${data.state}`);
                        });
                    }
                });
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


            // const onOffCluster = this.endpoint.getClusterClient(OnOffCluster);
            // if (onOffCluster !== undefined) {
            //     onOffCluster.setOnOff(state).then(() => {
            //         this.logger.info(`Set OnOff to ${state}`);
            //         resolve();
            //     }).catch((error) => {
            //         this.logger.error(`Failed to set OnOff: ${error}`);
            //         reject();
            //     });
            // } else {
            //     this.logger.error(`Device does not have OnOff cluster`);
            //     reject();
            // }
        });
    }
}