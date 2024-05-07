import { PairedNode, NodeStateInformation } from "@project-chip/matter-node.js/device";
import BaseDevice, { ConnectionStatus } from "./BaseDevice.js";
import { BooleanStateCluster } from "@project-chip/matter.js/cluster";
import { Logger } from "@project-chip/matter-node.js/log";
import { CommissioningController } from "@project-chip/matter.js";
import { Server } from "socket.io";
import { NodeId, EndpointNumber, DeviceTypeId } from "@project-chip/matter.js/datatype";
import { model, Schema } from "mongoose";
import { EndpointInterface } from "@project-chip/matter.js/endpoint";

// DB Schemas
export interface IContactSensorState {
    uniqueId: string;
    endpointId: string;
    connectionStatus: ConnectionStatus;
    booleanState: boolean;
    timestamp: number;
}

export interface IReturnContactSensorState {
    connectionStatus: ConnectionStatus;
    booleanState: boolean;
    timestamp: number;
}

const contactSensorStateSchema = new Schema<IContactSensorState>({
    uniqueId: { type: String, required: true },
    endpointId: { type: String, required: true },
    connectionStatus: { type: Number, required: true },
    booleanState: { type: Boolean },
    timestamp: { type: Number, required: true },
});

const ContactSensorState = model<IContactSensorState>('ContactSensorState', contactSensorStateSchema);

export default class ContactSensor extends BaseDevice {
    private _booleanState: boolean = false;

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
        this.logger = Logger.get("ContactSensor");
    }

    override setBaseDevice() {
        this.isBaseDevice = false;
    }

    override initialize(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            super.initialize().then(() => {
                // Subscribe to OnOff attribute
                const booleanStateCluster = this.endpoint.getClusterClient(BooleanStateCluster);
                if (booleanStateCluster !== undefined) {
                    booleanStateCluster.subscribeStateValueAttribute((state) => {
                        if (this._booleanState === state) return;

                        this._booleanState = state;
                        this.logger.info(`Boolean state changed to ${this._booleanState}`);

                        this.io.emit('booleanState', {
                            nodeId: this.nodeId.toString(),
                            endpointId: this.endpointId.toString(),
                            state: this._booleanState
                        });

                        // Check if the state is different from the last db entry
                        ContactSensorState.findOne({ uniqueId: this.nodeId.toString(), endpointId: this.endpointId.toString() }).sort({ timestamp: -1 }).then((doc) => {
                            if (doc === null || doc.booleanState !== state || doc.connectionStatus !== this.connectionStatus) {
                                const newDoc = new ContactSensorState({
                                    uniqueId: this._uniqueId.toString(),
                                    endpointId: this._endpointId.toString(),
                                    connectionStatus: this.connectionStatus,
                                    booleanState: state,
                                    timestamp: Date.now()
                                });
                                newDoc.save().then(() => {
                                    this.logger.info(`Saved Boolean state to DB`);
                                }).catch((error) => {
                                    this.logger.error(`Failed to save Boolean state to DB: ${error}`);
                                });
                            }
                        }).catch((error) => {
                            this.logger.error(`Failed to query DB: ${error}`);
                        });
                    }, 1, 10).then(() => {
                        this.logger.debug(`Subscribed to Boolean attribute`);
                        resolve();
                    }).catch((error) => {
                        this.logger.error(`Failed to subscribe to Boolean attribute: ${error}`);
                        reject();
                    });
                } else {
                    this.logger.error(`Device does not have a Boolean cluster`);
                    reject();
                }
            }).catch((error) => {
                reject(error);
            });
        });
    }

    override getHistory(from: number, to: number): Promise<IReturnContactSensorState[]> {
        return new Promise<IReturnContactSensorState[]>((resolve, reject) => {
            ContactSensorState.find<IContactSensorState>({ uniqueId: this._uniqueId, endpointId: this._endpointId.toString(), timestamp: { $gte: from, $lte: to } }).sort({ timestamp: 1 }).then((docs) => {
                resolve(docs.map((doc) => {
                    return {
                        connectionStatus: doc.connectionStatus,
                        booleanState: doc.booleanState,
                        timestamp: doc.timestamp
                    };
                }));
            }).catch((error) => {
                reject(error);
            });
        });
    }

    get booleanState(): boolean {
        return this._booleanState;
    }
}