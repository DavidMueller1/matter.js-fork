import { PairedNode, NodeStateInformation } from "@project-chip/matter-node.js/device";
import BaseDevice, { ChangeType, ConnectionStatus, PrivacyState } from "./BaseDevice.js";
import { ColorControlCluster, LevelControlCluster, OnOffCluster } from "@project-chip/matter.js/cluster";
import { Logger } from "@project-chip/matter-node.js/log";
import { CommissioningController } from "@project-chip/matter.js";
import { Server } from "socket.io";
import { NodeId, EndpointNumber, DeviceTypeId } from "@project-chip/matter.js/datatype";
import { model, Schema } from "mongoose";
import { EndpointInterface } from "@project-chip/matter.js/endpoint";
import VirtualOnOffPluginUnit from "../virtualDevices/VirtualOnOffPluginUnit.js";
import MqttManager from "../../mqtt/MqttManager.js";
import NeoPixelController from "../../util/NeoPixelController.js";

const logger = Logger.get("ExtendedColorLight");

// DB Schemas
export interface IExtendedColorLightState {
    uniqueId: string;
    endpointId: string;
    changeType: ChangeType;
    connectionStatus: ConnectionStatus;
    onOffState: boolean;
    hue: number;
    saturation: number;
    value: number;
    privacyState: PrivacyState;
    timestamp: number;
}

export interface IReturnExtendedColorLightState {
    connectionStatus: ConnectionStatus;
    onOffState: boolean;
    hue: number;
    saturation: number;
    value: number;
    privacyState: PrivacyState;
    timestamp: number;
}

const extendedColorLightStateSchema = new Schema<IExtendedColorLightState>({
    uniqueId: { type: String, required: true },
    endpointId: { type: String, required: true },
    changeType: { type: Number, required: true },
    connectionStatus: { type: Number, required: true },
    onOffState: { type: Boolean },
    hue: { type: Number, required: true },
    saturation: { type: Number, required: true },
    value: { type: Number, required: true },
    privacyState: { type: Number, required: true },
    timestamp: { type: Number, required: true },
});

const ExtendedColorLightState = model<IExtendedColorLightState>('ExtendedColorLightState', extendedColorLightStateSchema);

export default class ExtendedColorLight extends BaseDevice {
    private _onOffState: boolean = false;
    private _hue: number = 0;
    private _saturation: number = 0;
    private _value: number = 0;

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
        neoPixelController: NeoPixelController,
        stateInformationCallback?: (peerNodeId: NodeId, state: NodeStateInformation) => void
    ) {
        super(uniqueId, type, nodeId, endpointId, pairedNode, endpoint, commissioningController, io, mqttManager, neoPixelController, stateInformationCallback);
    }

    override setBaseDevice() {
        this.isBaseDevice = false;
    }

    override initialize(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            // TODO VirtualOnOffPluginUnit.create(
            //     this.nodeId,
            //     DeviceTypeId(this.type),
            //     this.pairedNode,
            //     (state) => {
            //         this.switchOnOff(state, false).then(() => {
            //             logger.info(`Successfully set OnOff state to ${state}`);
            //         }).catch((error) => {
            //             logger.error(`Failed to set OnOff state to ${state}: ${error}`);
            //         });
            //     }
            Promise.resolve().then((_) => {
                // this.virtualDevice = virtualDevice;

                super.initialize().then(() => {
                    // Subscribe attrubutes
                    const subscriptionPromises: Promise<void>[] = [];

                    // Subscribe to OnOff attribute
                    const onOffCluster = this.endpoint.getClusterClient(OnOffCluster);
                    if (onOffCluster !== undefined) {
                        subscriptionPromises.push(onOffCluster.subscribeOnOffAttribute((state) => {
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
                            // resolve();
                        }).catch((error) => {
                            logger.error(`Failed to subscribe to OnOff attribute: ${error}`);
                            reject();
                        }));
                    } else {
                        logger.error(`Device does not have OnOff cluster`);
                        reject();
                    }

                    const levelControlCluster = this.endpoint.getClusterClient(LevelControlCluster);
                    if (levelControlCluster !== undefined) {
                        subscriptionPromises.push(levelControlCluster.subscribeCurrentLevelAttribute((value) => {
                            logger.info(`CurrentLevel attribute event to ${value}`);
                            if (this._value === value) return;
                            this._value = value ?? 0;
                            // Publish data update to MQTT if assigned to a proxy
                            if (this._assignedProxy !== 0) {
                                this.mqttManager.publishDataUpdate(this._assignedProxy, false);
                            }
                            this.updateSocketAndDB(ChangeType.DEVICE_EVENT_DEVICE);
                            // this.virtualDevice?.setOnOffState(state); TODO
                            logger.info(`CurrentLevel attribute changed to ${value}`);
                        }, 1, 10).then(() => {
                            logger.debug(`Subscribed to CurrentLevel attribute`);
                            // resolve();
                        }).catch((error) => {
                            logger.error(`Failed to subscribe to CurrentLevel attribute: ${error}`);
                            reject();
                        }));
                    } else {
                        logger.error(`Device does not have LevelControl cluster`);
                        reject();
                    }

                    // Subscribe to ColorControl attributes
                    const colorControlCluster = this.endpoint.getClusterClient(ColorControlCluster);
                    if (colorControlCluster !== undefined) {
                        colorControlCluster.subscribePrimary1XAttribute((value) => {
                            logger.info(`======Primary1X attribute changed to ${value}`);
                        }, 1, 10).then(() => {
                            logger.debug(`Subscribed to NumberOfPrimaries attribute`);
                            // resolve();
                        }).catch((error) => {
                            logger.error(`Failed to subscribe to Primary1X attribute: ${error}`);
                            reject();
                        });
                    } else {
                        logger.error(`Device does not have ColorControl cluster`);
                        reject();
                    }

                    Promise.all(subscriptionPromises).then(() => {
                        resolve();
                    }).catch((error) => {
                        reject(error);
                    });


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

    setLevel(value: number): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const levelControlCluster = this.endpoint.getClusterClient(LevelControlCluster);
            if (levelControlCluster !== undefined) {
                if (this._value === value) return;
                this._value = value;

                // levelControlCluster.moveToLevelWithOnOff({
                levelControlCluster.moveToLevel({
                    level: value,
                    transitionTime: 0,
                    optionsMask: {
                        executeIfOff: false,
                        coupleColorTempToLevel: false,
                    },
                    optionsOverride: {
                        executeIfOff: false,
                        coupleColorTempToLevel: false,
                    }
                }).then(() => {
                    resolve();
                }).catch((error) => {
                    reject(error);
                });
            }
        });
    }

    setHueSaturation(hue: number, saturation: number): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const colorControlCluster = this.endpoint.getClusterServer(ColorControlCluster);
            if (colorControlCluster !== undefined) {
                if (this._hue === hue && this._saturation === saturation) return;
                this._hue = hue;
                this._saturation = saturation;

                colorControlCluster.moveToHue({
                    hue: hue,
                    direction: 0,
                    transitionTime: 0,
                    optionsMask: {
                        executeIfOff: false,
                    },
                    optionsOverride: {
                        executeIfOff: false,
                    }
                }).then(() => {
                    resolve();
                }).catch((error: any) => {
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

            this.io.emit('lightLevel', {
                nodeId: this.nodeId.toString(),
                endpointId: this.endpointId.toString(),
                value: this._value
            });
        }

        // Check if the state is different from the last db entry
        ExtendedColorLightState.findOne({ uniqueId: this.nodeId.toString(), endpointId: this.endpointId.toString() }).sort({ timestamp: -1 }).then((doc) => {
            if (
                doc === null ||
                doc.onOffState !== this._onOffState ||
                doc.hue !== this._hue ||
                doc.saturation !== this._saturation ||
                doc.value !== this._value ||
                doc.connectionStatus !== this.connectionStatus ||
                doc.privacyState !== this.privacyState
            ) {
                const newDoc = new ExtendedColorLightState({
                    uniqueId: this._uniqueId.toString(),
                    endpointId: this._endpointId.toString(),
                    changeType: changeType,
                    connectionStatus: this.connectionStatus,
                    onOffState: this._onOffState,
                    hue: this._hue,
                    saturation: this._saturation,
                    value: this._value,
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
            ExtendedColorLightState.findOne<IExtendedColorLightState>({ uniqueId: this._uniqueId }).sort({ timestamp: -1 }).then((state) => {
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

    override getHistory(from: number, to: number, onlineVersion: boolean): Promise<IReturnExtendedColorLightState[]> {
        return new Promise<IReturnExtendedColorLightState[]>((resolve, reject) => {
            ExtendedColorLightState.find<IExtendedColorLightState>({ uniqueId: this._uniqueId, endpointId: this._endpointId.toString(), timestamp: { $gte: from, $lte: to } }).sort({ timestamp: 1 }).then((docs) => {
                resolve(docs.map((doc) => {
                    if (onlineVersion && doc.privacyState === PrivacyState.LOCAL) {
                        return {
                            connectionStatus: ConnectionStatus.DISCONNECTED,
                            onOffState: false,
                            hue: 0,
                            saturation: 0,
                            value: 0,
                            privacyState: PrivacyState.LOCAL,
                            timestamp: doc.timestamp
                        };
                    } else {
                        return {
                            connectionStatus: doc.connectionStatus,
                            onOffState: doc.onOffState,
                            hue: doc.hue,
                            saturation: doc.saturation,
                            value: doc.value,
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

    get hue(): number {
        return this._hue;
    }

    get saturation(): number {
        return this._saturation;
    }

    get value(): number {
        return this._value;
    }
}