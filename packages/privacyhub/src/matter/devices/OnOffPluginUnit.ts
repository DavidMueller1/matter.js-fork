import { PairedNode, NodeStateInformation } from "@project-chip/matter-node.js/device";
import BaseDevice, { ConnectionStatus } from "./BaseDevice.js";
import { OnOffCluster } from "@project-chip/matter.js/cluster";
import { Logger } from "@project-chip/matter-node.js/log";
import { CommissioningController } from "@project-chip/matter.js";
import { Server } from "socket.io";
import { NodeId, EndpointNumber, DeviceTypeId } from "@project-chip/matter.js/datatype";
import { model, Schema } from "mongoose";
import { EndpointInterface } from "@project-chip/matter.js/endpoint";
import VirtualOnOffPluginUnit from "../virtualDevices/VirtualOnOffPluginUnit.js";

// DB Schemas
export interface IOnOffPluginUnitState {
    uniqueId: string;
    endpointId: string;
    connectionStatus: ConnectionStatus;
    onOffState: boolean;
    timestamp: number;
}

export interface IReturnOnOffPluginUnitState {
    connectionStatus: ConnectionStatus;
    onOffState: boolean;
    timestamp: number;
}

const onOffPluginUnitStateSchema = new Schema<IOnOffPluginUnitState>({
    uniqueId: { type: String, required: true },
    endpointId: { type: String, required: true },
    connectionStatus: { type: Number, required: true },
    onOffState: { type: Boolean },
    timestamp: { type: Number, required: true },
});

const OnOffPluginUnitState = model<IOnOffPluginUnitState>('OnOffPluginUnitState', onOffPluginUnitStateSchema);

export default class OnOffPluginUnit extends BaseDevice {
    private _onOffState: boolean = false;

    private virtualDevice: VirtualOnOffPluginUnit;

    constructor(
        uniqueId: string,
        type: DeviceTypeId,
        nodeId: NodeId,
        endpointId: EndpointNumber,
        pairedNode: PairedNode,
        endpoint: EndpointInterface,
        commissioningController: CommissioningController,
        io: Server,
        stateInformationCallback?: (peerNodeId: NodeId, state: NodeStateInformation) => void
    ) {
        super(uniqueId, type, nodeId, endpointId, pairedNode, endpoint, commissioningController, io, stateInformationCallback);
        this.logger = Logger.get("OnOffPluginUnit");
        this.virtualDevice = new VirtualOnOffPluginUnit(
            nodeId,
            type,
            pairedNode,
            (state) => {
                this.switchOnOff(state).then(() => {
                    this.logger.info(`Successfully set OnOff state to ${state}`);
                }).catch((error) => {
                    this.logger.error(`Failed to set OnOff state to ${state}: ${error}`);
                });
            }
        );
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
                        if (this._onOffState === state) return;

                        this._onOffState = state;
                        this.virtualDevice.setOnOffState(state);
                        this.logger.info(`OnOff state changed to ${this._onOffState}`);

                        this.io.emit('onOffState', {
                            nodeId: this.nodeId.toString(),
                            endpointId: this.endpointId.toString(),
                            state: this._onOffState
                        });

                        // Check if the state is different from the last db entry
                        OnOffPluginUnitState.findOne({ uniqueId: this.nodeId.toString(), endpointId: this.endpointId.toString() }).sort({ timestamp: -1 }).then((doc) => {
                            if (doc === null || doc.onOffState !== state || doc.connectionStatus !== this.connectionStatus) {
                                const newDoc = new OnOffPluginUnitState({
                                    uniqueId: this._uniqueId.toString(),
                                    endpointId: this._endpointId.toString(),
                                    connectionStatus: this.connectionStatus,
                                    onOffState: state,
                                    timestamp: Date.now()
                                });
                                newDoc.save().then(() => {
                                    this.logger.info(`Saved OnOff state to DB`);
                                }).catch((error) => {
                                    this.logger.error(`Failed to save OnOff state to DB: ${error}`);
                                });
                            }
                        }).catch((error) => {
                            this.logger.error(`Failed to query DB: ${error}`);
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
                        // this.virtualDevice.setOnOffState(state);
                        resolve();
                    }).catch((error) => {
                        this.logger.error(`Failed to toggle OnOff: ${error}`);
                        reject(error);
                    });
                } else {
                    (state ? onOffCluster.on() : onOffCluster.off()).then(() => {
                        // this.virtualDevice.setOnOffState(state);
                        resolve();
                    }).catch((error) => {
                        this.logger.error(`Failed to set OnOff: ${error}`);
                        reject(error);
                    });
                }
            }
        });
    }

    override getHistory(from: number, to: number): Promise<IReturnOnOffPluginUnitState[]> {
        return new Promise<IReturnOnOffPluginUnitState[]>((resolve, reject) => {
            OnOffPluginUnitState.find<IOnOffPluginUnitState>({ uniqueId: this._uniqueId, endpointId: this._endpointId.toString(), timestamp: { $gte: from, $lte: to } }).sort({ timestamp: 1 }).then((docs) => {
                resolve(docs.map((doc) => {
                    return {
                        connectionStatus: doc.connectionStatus,
                        onOffState: doc.onOffState,
                        timestamp: doc.timestamp
                    };
                }));
            }).catch((error) => {
                reject(error);
            });
        });
    }

    get onOffState(): boolean {
        return this._onOffState;
    }
}