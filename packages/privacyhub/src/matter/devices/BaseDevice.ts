import { PairedNode, NodeStateInformation } from "@project-chip/matter-node.js/device";
import { Logger } from "@project-chip/matter-node.js/log";
import { CommissioningController } from "@project-chip/matter-node.js";
import { NodeId, EndpointNumber, DeviceTypeId } from "@project-chip/matter-node.js/datatype";
import { EndpointInterface } from "@project-chip/matter.js/endpoint";
import { Server } from "socket.io";
import { Schema, model } from "mongoose";
import VirtualBaseDevice from "../virtualDevices/VirtualBaseDevice.js";
import MqttManager from "../../mqtt/MqttManager.js";

const logger = Logger.get("BaseDevice");

export enum ConnectionStatus {
    CONNECTED,
    DISCONNECTED,
}

export enum PrivacyState {
    LOCAL,
    THIRD_PARTY,
    ONLINE,
}

// DB schema
interface IDevice {
    uniqueId: string;
    endpointId: string;
    type: number;
    assignedProxy?: number;
}

const deviceSchema = new Schema<IDevice>({
    uniqueId: { type: String, required: true },
    endpointId: { type: String, required: true },
    type: { type: Number, required: true },
    assignedProxy: { type: Number },
});

const Device = model<IDevice>('Device', deviceSchema);


export interface IBaseDeviceState {
    uniqueId: string;
    endpointId: string;
    connectionStatus: ConnectionStatus;
    privacyState: PrivacyState;
    timestamp: number;
}

export interface IReturnBaseDeviceState {
    connectionStatus: ConnectionStatus;
    privacyState: PrivacyState;
    timestamp: number;
}

const baseDeviceStateSchema = new Schema<IBaseDeviceState>({
    uniqueId: { type: String, required: true },
    endpointId: { type: String, required: true },
    connectionStatus: { type: Number, required: true },
    privacyState: { type: Number, required: true },
    timestamp: { type: Number, required: true },
});

const BaseDeviceState = model<IBaseDeviceState>('BaseDeviceState', baseDeviceStateSchema);

export default class BaseDevice {
    protected isBaseDevice = true;

    protected commissioningController: CommissioningController;
    protected io: Server;
    protected mqttManager: MqttManager;

    protected _uniqueId: string;
    protected _nodeId: NodeId;
    protected _endpointId: EndpointNumber;
    protected _vendor: string | undefined;
    protected _product: string | undefined;
    protected _type: DeviceTypeId;
    protected _assignedProxy: number;

    protected pairedNode: PairedNode;
    protected endpoint: EndpointInterface;

    protected virtualDevice: VirtualBaseDevice | undefined;

    protected connectionStatus: ConnectionStatus = ConnectionStatus.DISCONNECTED;
    protected privacyState: PrivacyState = PrivacyState.LOCAL;

    protected stateInformationCallback?: (nodeId: NodeId, state: NodeStateInformation) => void;

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
        stateInformationCallback?: (nodeId: NodeId, state: NodeStateInformation) => void
    ){
        this._uniqueId = uniqueId;
        this._type = type;
        this._nodeId = nodeId;
        this._endpointId = endpointId;
        this._assignedProxy = 0;

        this.pairedNode = pairedNode;
        this.endpoint = endpoint;
        this.commissioningController = commissioningController;
        this.io = io;
        this.mqttManager = mqttManager;
        this.stateInformationCallback = stateInformationCallback;

        this.setBaseDevice();

        this.getVendorAndProduct();

        this.initialize().then(() => {
            logger.info(`Initialized device ${this._nodeId} with unique ID ${this._uniqueId}`);
        }).catch((error) => {
            logger.error(`Failed to connect to node: ${error}`);
            this.setConnectionStatus(ConnectionStatus.DISCONNECTED);
        });
    }

    // Set the device as a base device
    setBaseDevice() {
        this.isBaseDevice = true;
    }

    get nodeId(): NodeId {
        return this._nodeId;
    }

    get endpointId(): EndpointNumber {
        return this._endpointId;
    }

    get vendor() {
        return this._vendor;
    }

    get product() {
        return this._product;
    }

    get type(): number {
        return this._type;
    }

    get assignedProxy(): number {
        return this._assignedProxy;
    }

    protected initialize(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.setLastKnownPrivacyState().then(() => {
                this.setConnectionStatus(this.pairedNode.isConnected ? ConnectionStatus.CONNECTED : ConnectionStatus.DISCONNECTED)

                // Generate DB document if it does not exist
                Device.findOne<IDevice>({uniqueId: this._uniqueId}).then((device) => {
                    if (device) {
                        // Device exists
                        if (device.assignedProxy) {
                            this._assignedProxy = device.assignedProxy;
                        }
                        resolve();
                    } else {
                        // Device does not exist, create it
                        const newDevice = new Device({
                            uniqueId: this._uniqueId,
                            endpointId: this._endpointId.toString(),
                            type: this._type,
                            assignedProxy: this._assignedProxy,
                        });
                        newDevice.save().then(() => {
                            resolve();
                        }).catch((error) => {
                            reject(error);
                        });
                    }
                }).catch((error) => {
                    reject(error);
                });

            }).catch((error) => {
                reject(error);
            });
        });
    }

    getVendorAndProduct(): void {
        const nodeDetails = this.commissioningController.getCommissionedNodesDetails();
        const details = nodeDetails.find((n) => n.nodeId === this.nodeId);

        this._vendor = details?.basicInformationData?.vendorName?.toString();
        this._product = details?.basicInformationData?.productName?.toString();
    }

    setConnectionStatus(status: ConnectionStatus) {
        logger.info(`Connection status of ${this.nodeId.toString()} changed to ${status}`);
        this.connectionStatus = status;

        this.updateVirtualDeviceState();
        this.updateSocketAndDB();
    }

    getConnectionStatus(): ConnectionStatus {
        return this.connectionStatus;
    }

    setPrivacyState(state: PrivacyState) {
        logger.debug(`Privacy state of ${this.nodeId.toString()} changed to ${state}`);
        this.privacyState = state;

        this.updateVirtualDeviceState();
        this.updateSocketAndDB();
    }

    getPrivacyState(): PrivacyState {
        return this.privacyState;
    }

    setAssignedProxy(proxyId: number): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            Device.updateOne({uniqueId: this._uniqueId}, {assignedProxy: proxyId}).then(() => {
                this._assignedProxy = proxyId;
                resolve();
            }).catch((error) => {
                reject(error);
            });
        });
    }

    getAssignedProxy(): number {
        return this._assignedProxy;
    }

    protected updateVirtualDeviceState() {
        if (this.connectionStatus !== ConnectionStatus.CONNECTED || this.privacyState === PrivacyState.LOCAL) {
            this.stopVirtualDevice();
        } else {
            this.startVirtualDevice();
        }
    }

    protected updateSocketAndDB() {
        // Notify the client
        this.io.emit('connectionStatus', {
            nodeId: this.nodeId.toString(),
            endpointId: this.endpointId.toString(),
            connectionStatus: this.connectionStatus,
        });

        this.io.emit('privacyState', {
            nodeId: this.nodeId.toString(),
            endpointId: this.endpointId.toString(),
            privacyState: this.privacyState,
        });

        // Add state change to DB
        if (this.isBaseDevice) {
            BaseDeviceState.findOne<IBaseDeviceState>({ uniqueId: this._uniqueId }).sort({ timestamp: -1 }).then((state) => {
                if (state) {
                    if (state.connectionStatus !== this.connectionStatus) {
                        const newState = new BaseDeviceState({
                            uniqueId: this._uniqueId,
                            endpointId: this._endpointId.toString(),
                            connectionStatus: this.connectionStatus,
                            privacyState: this.privacyState,
                            timestamp: Date.now(),
                        });
                        newState.save().then(() => {
                            logger.info(`Saved new state ${this.connectionStatus}`);
                        }).catch((error) => {
                            logger.error(`Failed to save new state: ${error}`);
                        });
                    }
                } else {
                    const newState = new BaseDeviceState({
                        uniqueId: this._uniqueId,
                        endpointId: this._endpointId.toString(),
                        connectionStatus: this.connectionStatus,
                        timestamp: Date.now(),
                    });
                    newState.save().then(() => {
                        logger.info(`Saved new state ${this.connectionStatus}`);
                    }).catch((error) => {
                        logger.error(`Failed to save new state: ${error}`);
                    });
                }
            }).catch((error) => {
                logger.error(`Failed to get state: ${error}`);
            });
        }
    }

    public setLastKnownPrivacyState(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            BaseDeviceState.findOne<IBaseDeviceState>({ uniqueId: this._uniqueId }).sort({ timestamp: -1 }).then((state) => {
                if (state) {
                    this.setPrivacyState(state.privacyState);
                }
                resolve();
            }).catch((error) => {
                reject(error);
            });
        });
    }

    getHistory(from: number, to: number): Promise<IReturnBaseDeviceState[]> {
        return new Promise<IReturnBaseDeviceState[]>((resolve, reject) => {
            BaseDeviceState.find<IBaseDeviceState>({ uniqueId: this._uniqueId, endpointId: this._endpointId.toString(), timestamp: { $gte: from, $lte: to } }).then((docs) => {
                resolve(docs.map((doc) => {
                    return {
                        connectionStatus: doc.connectionStatus,
                        privacyState: doc.privacyState,
                        timestamp: doc.timestamp
                    };
                }));
            }).catch((error) => {
                reject(error);
            });
        });
    }

    startVirtualDevice() {
        logger.info(`Starting virtual device for ${this.nodeId.toString()}`);
        this.virtualDevice?.start();
    }

    stopVirtualDevice() {
        logger.info(`Stopping virtual device for ${this.nodeId.toString()}`);
        this.virtualDevice?.stop();
    }

    getManualPairingCode(): string {
        return this.virtualDevice?.getManualPairingCode() || "0";
    }

    getQRCode(): string {
        return this.virtualDevice?.getQRCode() || "0";
    }

    getDeviceObject<T extends BaseDevice>(type: new () => T): T | undefined {
        if (this instanceof type) {
            return this as T;
        }
        return undefined;
    }
}