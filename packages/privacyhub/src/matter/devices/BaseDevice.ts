import { PairedNode, Endpoint } from "@project-chip/matter-node.js/device";
import { Logger } from "@project-chip/matter-node.js/log";
import { CommissioningController, MatterServer, NodeCommissioningOptions } from "@project-chip/matter-node.js";
import { NodeId, EndpointNumber } from "@project-chip/matter-node.js/datatype";
import { Server } from "socket.io";
import { type } from "typedoc/dist/lib/output/themes/default/partials/type.js";
import { resolve } from "eslint-import-resolver-typescript";
import * as console from "console";
import { NodeStateInformation } from "@project-chip/matter.js/src/device/PairedNode.js";
import { Schema, model } from "mongoose";

export enum ConnectionStatus {
    CONNECTED,
    DISCONNECTED,
}

export enum PrivacyState {
    LOCAL_ONLY,
    REMOTE_ACCESS,
    ALL_ACCESS,
}

// DB schema
interface IDevice {
    uniqueId: string;
    endpointId: string;
    type: number;
}

const deviceSchema = new Schema<IDevice>({
    uniqueId: { type: String, required: true },
    endpointId: { type: String, required: true },
    type: { type: Number, required: true },
});

const Device = model<IDevice>('Device', deviceSchema);


export interface IBaseDeviceState {
    uniqueId: string;
    endpointId: string;
    connectionStatus: ConnectionStatus;
    timestamp: number;
}

const baseDeviceStateSchema = new Schema<IBaseDeviceState>({
    uniqueId: { type: String, required: true },
    endpointId: { type: String, required: true },
    connectionStatus: { type: Number, required: true },
    timestamp: { type: Number, required: true },
});

const BaseDeviceState = model<IBaseDeviceState>('BaseDeviceState', baseDeviceStateSchema);

export default class BaseDevice {
    protected isBaseDevice = true;

    protected commissioningController: CommissioningController;
    protected io: Server;

    protected _uniqueId: string;
    protected _nodeId: NodeId;
    protected _endpointId: EndpointNumber;

    protected pairedNode: PairedNode;
    protected endpoint: Endpoint;
    protected logger: Logger;

    protected connectionStatus: ConnectionStatus = ConnectionStatus.DISCONNECTED;
    protected privacyState: PrivacyState = PrivacyState.LOCAL_ONLY;

    protected stateInformationCallback?: (nodeId: NodeId, state: NodeStateInformation) => void;

    constructor(
        uniqueId: string,
        nodeId: NodeId,
        endpointId: EndpointNumber,
        pairedNode: PairedNode,
        endpoint: Endpoint,
        commissioningController: CommissioningController,
        io: Server,
        stateInformationCallback?: (nodeId: NodeId, state: NodeStateInformation) => void
    ){
        this._uniqueId = uniqueId;
        this._nodeId = nodeId;
        this._endpointId = endpointId;
        this.pairedNode = pairedNode;
        this.endpoint = endpoint;
        this.commissioningController = commissioningController;
        this.io = io;
        this.stateInformationCallback = stateInformationCallback;
        this.logger = Logger.get("BaseDevice");

        this.setBaseDevice();

        this.initialize().then(() => {
            this.logger.info(`Initialized device ${this._nodeId}`);
            this.setConnectionStatus(this.pairedNode.isConnected ? ConnectionStatus.CONNECTED : ConnectionStatus.DISCONNECTED);
        }).catch((error) => {
            this.logger.error(`Failed to connect to node: ${error}`);
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

    protected initialize(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.setConnectionStatus(this.pairedNode.isConnected ? ConnectionStatus.CONNECTED : ConnectionStatus.DISCONNECTED)

            // Generate DB document if it does not exist
            Device.findOne<IDevice>({uniqueId: this._uniqueId}).then((device) => {
                if (device) {
                    // Device exists
                    resolve();
                } else {
                    // Device does not exist, create it
                    const newDevice = new Device({
                        uniqueId: this._uniqueId,
                        endpointId: this._endpointId.toString(),
                        type: this.endpoint.getDeviceTypes()[0].code,
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
        });
    }

    setConnectionStatus(status: ConnectionStatus) {
        this.logger.info(`Connection status of ${this.nodeId.toString()} changed to ${status}`);
        this.connectionStatus = status;

        // Notify the client
        this.io.emit('connectionStatus', {
            nodeId: this.nodeId.toString(),
            endpointId: this.endpointId.toString(),
            status: this.connectionStatus,
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
                            timestamp: Date.now(),
                        });
                        newState.save().then(() => {
                            this.logger.info(`Saved new state ${this.connectionStatus}`);
                        }).catch((error) => {
                            this.logger.error(`Failed to save new state: ${error}`);
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
                        this.logger.info(`Saved new state ${this.connectionStatus}`);
                    }).catch((error) => {
                        this.logger.error(`Failed to save new state: ${error}`);
                    });
                }
            }).catch((error) => {
                this.logger.error(`Failed to get state: ${error}`);
            });
        }
    }


    getDeviceObject<T extends BaseDevice>(type: new () => T): T | undefined {
        if (this instanceof type) {
            return this as T;
        }
        return undefined;
    }

    // static connectToNode(nodeId: string, commissioningController: CommissioningController): Promise<PairedNode> {
    //     return new Promise( (resolve, reject) => {
    //         // const node = await this.commissioningController.connectNode(nodeId, {
    //         commissioningController.connectNode(NodeId(Number(nodeId))).then((node: PairedNode) => {
    //             resolve(node);
    //         }).catch((error) => {
    //             console.log(`Error connecting to node: ${error}`);
    //             reject(error);
    //         });
    //     });
    // }
}