import { PairedNode, NodeStateInformation } from "@project-chip/matter-node.js/device";
import BaseDevice, { ConnectionStatus, PrivacyState } from "./BaseDevice.js";
import { BooleanStateCluster } from "@project-chip/matter.js/cluster";
import { Logger } from "@project-chip/matter-node.js/log";
import { CommissioningController } from "@project-chip/matter.js";
import { Server } from "socket.io";
import { NodeId, EndpointNumber, DeviceTypeId } from "@project-chip/matter.js/datatype";
import { model, Schema } from "mongoose";
import { EndpointInterface } from "@project-chip/matter.js/endpoint";
import VirtualContactSensor from "../virtualDevices/VirtualContactSensor.js";
import MqttManager from "../../mqtt/MqttManager.js";

const logger = Logger.get("ContactSensor");

// DB Schemas
export interface IContactSensorState {
    uniqueId: string;
    endpointId: string;
    connectionStatus: ConnectionStatus;
    booleanState: boolean;
    privacyState: PrivacyState;
    timestamp: number;
}

export interface IReturnContactSensorState {
    connectionStatus: ConnectionStatus;
    booleanState: boolean;
    privacyState: PrivacyState;
    timestamp: number;
}

const contactSensorStateSchema = new Schema<IContactSensorState>({
    uniqueId: { type: String, required: true },
    endpointId: { type: String, required: true },
    connectionStatus: { type: Number, required: true },
    booleanState: { type: Boolean },
    privacyState: { type: Number, required: true },
    timestamp: { type: Number, required: true },
});

const ContactSensorState = model<IContactSensorState>('ContactSensorState', contactSensorStateSchema);

export default class ContactSensor extends BaseDevice {
    private _booleanState: boolean = false;

    override virtualDevice: VirtualContactSensor | undefined;

    constructor(
        uniqueId: string,
        type: DeviceTypeId,
        nodeId: NodeId,
        endpointId: EndpointNumber,
        pairedNode: PairedNode,
        endpoint: EndpointInterface,
        commissioningController: CommissioningController,
        io: Server,
        mqttManager: MqttManager,
        stateInformationCallback?: (peerNodeId: NodeId, state: NodeStateInformation) => void
    ) {
        super(uniqueId, type, nodeId, endpointId, pairedNode, endpoint, commissioningController, io, mqttManager, stateInformationCallback);
    }

    override setBaseDevice() {
        this.isBaseDevice = false;
    }

    override initialize(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            VirtualContactSensor.create(
                this.nodeId,
                DeviceTypeId(this.type),
                this.pairedNode,
(state) => {
                    logger.info(`Dings ÄHH Boolean state changed to ${state}`);
                    // this._booleanState = state;
                    // this.updateSocketAndDB();
                }
            ).then((virtualDevice) => {
                this.virtualDevice = virtualDevice;

                super.initialize().then(() => {
                    // Subscribe to OnOff attribute
                    const booleanStateCluster = this.endpoint.getClusterClient(BooleanStateCluster);
                    if (booleanStateCluster !== undefined) {
                        booleanStateCluster.subscribeStateValueAttribute((state) => {
                            if (this._booleanState === state) return;
                            this._booleanState = state;

                            // Publish data update to MQTT if assigned to a proxy
                            if (this._assignedProxy !== 0) {
                                this.mqttManager.publishDataUpdate(this._assignedProxy, false);
                            }
                            this.updateSocketAndDB();
                            this.virtualDevice?.setContactState(state);
                            logger.info(`Boolean state changed to ${this._booleanState}`);
                        }, 1, 10).then(() => {
                            logger.debug(`Subscribed to Boolean attribute`);
                            resolve();
                        }).catch((error) => {
                            logger.error(`Failed to subscribe to Boolean attribute: ${error}`);
                            reject();
                        });
                    } else {
                        logger.error(`Device does not have a Boolean cluster`);
                        reject();
                    }
                }).catch((error) => {
                    reject(error);
                });

            }).catch((error) => {
                logger.error(`Failed to create virtual device: ${error}`);
                reject(error);
            });
        });
    }

    override updateSocketAndDB() {
        this.io.emit('booleanState', {
            nodeId: this.nodeId.toString(),
            endpointId: this.endpointId.toString(),
            state: this._booleanState
        });

        this.io.emit('connectionStatus', {
            nodeId: this.nodeId.toString(),
            endpointId: this.endpointId.toString(),
            connectionStatus: this.connectionStatus
        });

        this.io.emit('privacyState', {
            nodeId: this.nodeId.toString(),
            endpointId: this.endpointId.toString(),
            privacyState: this.privacyState
        });

        // Check if the state is different from the last db entry
        ContactSensorState.findOne({ uniqueId: this.nodeId.toString(), endpointId: this.endpointId.toString() }).sort({ timestamp: -1 }).then((doc) => {
            if (
                doc === null ||
                doc.booleanState !== this._booleanState ||
                doc.connectionStatus !== this.connectionStatus ||
                doc.privacyState !== this.privacyState
            ) {
                const newDoc = new ContactSensorState({
                    uniqueId: this._uniqueId.toString(),
                    endpointId: this._endpointId.toString(),
                    connectionStatus: this.connectionStatus,
                    booleanState: this._booleanState,
                    privacyState: this.privacyState,
                    timestamp: Date.now()
                });
                newDoc.save().then(() => {
                    logger.info(`Saved Boolean state to DB`);
                }).catch((error) => {
                    logger.error(`Failed to save Boolean state to DB: ${error}`);
                });
            }
        }).catch((error) => {
            logger.error(`Failed to query DB: ${error}`);
        });
    }

    public override setLastKnownPrivacyState(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            ContactSensorState.findOne<IContactSensorState>({ uniqueId: this._uniqueId }).sort({ timestamp: -1 }).then((state) => {
                if (state) {
                    this.setPrivacyState(state.privacyState);
                }
                resolve();
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
                        privacyState: doc.privacyState,
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