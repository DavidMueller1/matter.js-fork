import { CommissioningController } from "@project-chip/matter.js";
import { Server } from "socket.io";
import { PairedNode, NodeStateInformation } from "@project-chip/matter-node.js/device";
import { NodeId } from "@project-chip/matter-node.js/datatype";
import OnOffPluginUnit from "./OnOffPluginUnit.js";
import BaseDevice, { ConnectionStatus } from "./BaseDevice.js";
import { EndpointNumber } from "@project-chip/matter.js/datatype";

export default class DeviceManager {

    private static _instance: DeviceManager;

    private devices: BaseDevice[] = [];

    private constructor() {}

    public static getInstance = (): DeviceManager => {
        if (!DeviceManager._instance) {
            DeviceManager._instance = new DeviceManager();
        }
        return DeviceManager._instance;
    }

    public generateDevices(nodeId: NodeId, commissioningController: CommissioningController, io: Server): Promise<BaseDevice[]>  {
        return new Promise<BaseDevice[]>((resolve, reject) => {
            commissioningController.connectNode(nodeId, {
                stateInformationCallback: (peerNodeId, state) => {
                    console.log(`State information for node ${peerNodeId.toString()}: ${state.toString()}`);
                    this.deviceStateInformationCallback(peerNodeId, state);
                },
            }).then((node: PairedNode) => {
                const devices: BaseDevice[] = [];
                node.getDevices().forEach((device) => {
                    const type = device.getDeviceTypes()[0];
                    switch (type.code) {
                        case 266:
                            const onOffPluginUnit = new OnOffPluginUnit(nodeId, device.getId(), node, device, commissioningController, io);
                            this.devices.push(onOffPluginUnit);
                            devices.push(onOffPluginUnit);
                            break;
                        default:
                            const unknownDevice = new BaseDevice(nodeId, device.getId(), node, device, commissioningController, io);
                            this.devices.push(unknownDevice);
                            devices.push(unknownDevice);
                            break;
                    }
                });
                resolve(devices);
            }).catch((error) => {
                console.log(`Error connecting to node: ${error}`);
                reject(error);
            });
        });
    }

    public getDevices = (): BaseDevice[] => {
        return this.devices;
    }

    public getDevice(nodeId: NodeId, endpointId: EndpointNumber): BaseDevice | undefined {
        return this.devices.find((device) => {
            return device.nodeId === nodeId && device.endpointId === endpointId;
        });
    }

    private deviceStateInformationCallback = (nodeId: NodeId, state: NodeStateInformation) => {
        const devices = this.devices.filter((device) => {
            return device.nodeId === nodeId;
        });
        devices.forEach((device) => {
            if (state === NodeStateInformation.Connected) {
                device.setConnectionStatus(ConnectionStatus.CONNECTED)
            } else {
                device.setConnectionStatus(ConnectionStatus.DISCONNECTED)
            }
        });
    }
}