import { PairedNode, NodeStateInformation } from "@project-chip/matter-node.js/device";
import BaseDevice, { ChangeType, ConnectionStatus, PrivacyState } from "./BaseDevice.js";
import { OnOffCluster } from "@project-chip/matter.js/cluster";
import { Logger } from "@project-chip/matter-node.js/log";
import { CommissioningController } from "@project-chip/matter.js";
import { Server } from "socket.io";
import { NodeId, EndpointNumber, DeviceTypeId } from "@project-chip/matter.js/datatype";
import { model, Schema } from "mongoose";
import { EndpointInterface } from "@project-chip/matter.js/endpoint";
import VirtualOnOffPluginUnit from "../virtualDevices/VirtualOnOffPluginUnit.js";
import MqttManager from "../../mqtt/MqttManager.js";

const logger = Logger.get("OnOffPluginUnit");

// DB Schemas
export interface IOnOffPluginUnitState {
    uniqueId: string;
    endpointId: string;
    changeType: ChangeType;
    connectionStatus: ConnectionStatus;
    onOffState: boolean;
    privacyState: PrivacyState;
    timestamp: number;
}

export interface IReturnOnOffPluginUnitState {
    connectionStatus: ConnectionStatus;
    onOffState: boolean;
    privacyState: PrivacyState;
    timestamp: number;
}

const onOffPluginUnitStateSchema = new Schema<IOnOffPluginUnitState>({
    uniqueId: { type: String, required: true },
    endpointId: { type: String, required: true },
    changeType: { type: Number, required: true },
    connectionStatus: { type: Number, required: true },
    onOffState: { type: Boolean },
    privacyState: { type: Number, required: true },
    timestamp: { type: Number, required: true },
});

const OnOffPluginUnitState = model<IOnOffPluginUnitState>('OnOffPluginUnitState', onOffPluginUnitStateSchema);

export default class OnOffPluginUnit extends BaseDevice {
    private _onOffState: boolean = false;

    override virtualDevice: VirtualOnOffPluginUnit | undefined;

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
            VirtualOnOffPluginUnit.create(
                this.nodeId,
                DeviceTypeId(this.type),
                this.pairedNode,
                (state) => {
                    this.switchOnOff(state, false).then(() => {
                        logger.info(`Successfully set OnOff state to ${state}`);
                    }).catch((error) => {
                        logger.error(`Failed to set OnOff state to ${state}: ${error}`);
                    });
                }
            ).then((virtualDevice) => {
                this.virtualDevice = virtualDevice;

                super.initialize().then(() => {
                    // Subscribe to OnOff attribute
                    const onOffCluster = this.endpoint.getClusterClient(OnOffCluster);
                    if (onOffCluster !== undefined) {
                        onOffCluster.subscribeOnOffAttribute((state) => {
                            if (this._onOffState === state) return;
                            this._onOffState = state;

                            // Publish data update to MQTT if assigned to a proxy
                            if (this._assignedProxy !== 0) {
                                this.mqttManager.publishDataUpdate(this._assignedProxy, false);
                            }
                            this.updateSocketAndDB(ChangeType.DEVICE_EVENT_DEVICE);
                            this.virtualDevice?.setOnOffState(state);
                            logger.info(`OnOff state from device changed to ${this._onOffState}`);
                        }, 1, 10).then(() => {
                            logger.debug(`Subscribed to OnOff attribute`);
                            resolve();
                        }).catch((error) => {
                            logger.error(`Failed to subscribe to OnOff attribute: ${error}`);
                            reject();
                        });
                    } else {
                        logger.error(`Device does not have OnOff cluster`);
                        reject();
                    }
                }).catch((error) => {
                    reject(error);
                });
            }).catch((error) => {
                logger.error(`Failed to create virtual device: ${error}`)
                reject(error);
            });
        });
    }

    switchOnOff(state: boolean, isHubUpdate: boolean): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const onOffCluster = this.endpoint.getClusterClient(OnOffCluster);
            if (onOffCluster !== undefined) {
                if (this._onOffState === state) return;
                this._onOffState = state;

                // Publish data update to MQTT if assigned to a proxy
                if (this._assignedProxy !== 0) {
                    this.mqttManager.publishDataUpdate(this._assignedProxy, true);
                }
                this.updateSocketAndDB(isHubUpdate ? ChangeType.DEVICE_EVENT_HUB : ChangeType.DEVICE_EVENT_THIRD_PARTY);
                this.virtualDevice?.setOnOffState(state);
                logger.info(`OnOff state externally switched to ${this._onOffState}`);
                (state ? onOffCluster.on() : onOffCluster.off()).then(() => {
                    // this.virtualDevice.setOnOffState(state);
                    // this.updateSocketAndDB();
                    resolve();
                }).catch((error) => {
                    logger.error(`Failed to set OnOff: ${error}`);
                    reject(error);
                });
            }
        });
    }

    override updateSocketAndDB(changeType: ChangeType) {
        super.updateSocketAndDB(changeType);

        if (
            changeType === ChangeType.DEVICE_EVENT_DEVICE
            || changeType === ChangeType.DEVICE_EVENT_THIRD_PARTY
            || changeType === ChangeType.DEVICE_EVENT_HUB
        ) {
            this.io.emit('booleanState', {
                nodeId: this.nodeId.toString(),
                endpointId: this.endpointId.toString(),
                state: this._onOffState
            });
        }

        // Check if the state is different from the last db entry
        OnOffPluginUnitState.findOne({ uniqueId: this.nodeId.toString(), endpointId: this.endpointId.toString() }).sort({ timestamp: -1 }).then((doc) => {
            if (
                doc === null ||
                doc.onOffState !== this._onOffState ||
                doc.connectionStatus !== this.connectionStatus ||
                doc.privacyState !== this.privacyState
            ) {
                const newDoc = new OnOffPluginUnitState({
                    uniqueId: this._uniqueId.toString(),
                    endpointId: this._endpointId.toString(),
                    changeType: changeType,
                    connectionStatus: this.connectionStatus,
                    onOffState: this._onOffState,
                    privacyState: this.privacyState,
                    timestamp: Date.now()
                });
                newDoc.save().then(() => {
                    logger.info(`Saved OnOff state to DB`);
                }).catch((error) => {
                    logger.error(`Failed to save OnOff state to DB: ${error}`);
                });
            }
        }).catch((error) => {
            logger.error(`Failed to query DB: ${error}`);
        });
    }

    public override setLastKnownPrivacyState(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            OnOffPluginUnitState.findOne<IOnOffPluginUnitState>({ uniqueId: this._uniqueId }).sort({ timestamp: -1 }).then((state) => {
                logger.info(`Setting last known privacy state to ${JSON.stringify(state)}`);
                if (state) {
                    this.setPrivacyState(state.privacyState, false);
                }
                resolve();
            }).catch((error) => {
                reject(error);
            });
        });
    }

    override getHistory(from: number, to: number, onlineVersion: boolean): Promise<IReturnOnOffPluginUnitState[]> {
        return new Promise<IReturnOnOffPluginUnitState[]>((resolve, reject) => {
            OnOffPluginUnitState.find<IOnOffPluginUnitState>({ uniqueId: this._uniqueId, endpointId: this._endpointId.toString(), timestamp: { $gte: from, $lte: to } }).sort({ timestamp: 1 }).then((docs) => {
                resolve(docs.map((doc) => {
                    if (onlineVersion && doc.privacyState === PrivacyState.LOCAL) {
                        return {
                            connectionStatus: ConnectionStatus.DISCONNECTED,
                            onOffState: false,
                            privacyState: PrivacyState.LOCAL,
                            timestamp: doc.timestamp
                        };
                    } else {
                        return {
                            connectionStatus: doc.connectionStatus,
                            onOffState: doc.onOffState,
                            privacyState: doc.privacyState,
                            timestamp: doc.timestamp
                        };
                    }
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