import { CommissioningController } from "@project-chip/matter.js";
import { Server } from "socket.io";
import { PairedNode, NodeStateInformation } from "@project-chip/matter-node.js/device";
import { NodeId } from "@project-chip/matter-node.js/datatype";
import OnOffPluginUnit from "./OnOffPluginUnit.js";
import BaseDevice, { ConnectionStatus, PrivacyState } from "./BaseDevice.js";
import { EndpointNumber } from "@project-chip/matter.js/datatype";
import { BasicInformationCluster, DescriptorCluster } from "@project-chip/matter-node.js/cluster";
import { Logger } from "@project-chip/matter-node.js/log";
import { ignoreTypes } from "../PrivacyhubNode.js";
import ContactSensor from "./ContactSensor.js";
import { stringifyWithBigint } from "../../util/Util.js";

export default class DeviceManager {

    private logger: Logger = Logger.get("DeviceManager");
    private devices: BaseDevice[] = [];

    constructor() {}

    public generateDevices(nodeId: NodeId, commissioningController: CommissioningController, io: Server): Promise<BaseDevice[]>  {
        return new Promise<BaseDevice[]>((resolve, reject) => {
            commissioningController.connectNode(nodeId, {
                stateInformationCallback: (peerNodeId, state) => {
                    console.log(`State information for node ${peerNodeId.toString()}: ${state.toString()}`);
                    this.deviceStateInformationCallback(peerNodeId, state);
                },
            }).then((node: PairedNode) => {
                this.logger.info(`---------NODE STRUCTURE---------`);
                node.logStructure();
                const basicInformation = node.getRootClusterClient(BasicInformationCluster);
                if (basicInformation !== undefined) {
                    basicInformation.getUniqueIdAttribute().then((uniqueId) => {
                        if (uniqueId === undefined) {
                            reject("Failed to get unique ID");
                            return;
                        }
                        const devices: BaseDevice[] = [];
                        node.getDevices().forEach((device) => {
                            this.logger.info(`Device: ${device.getNumber()}`);
                            const deviceDescriptor = device.getClusterClient(DescriptorCluster)
                            if (deviceDescriptor === undefined) {
                                reject("Failed to get device descriptor");
                                return;
                            } else {
                                deviceDescriptor.getDeviceTypeListAttribute().then((deviceTypeList) => {
                                    this.logger.info(`===== Device type list: ${stringifyWithBigint(deviceTypeList)}`);

                                    const type = deviceTypeList[0].deviceType;
                                    if (type in ignoreTypes) {
                                        this.logger.debug(`Ignoring device type ${type}`);
                                        return;
                                    }

                                    switch (type) {
                                        case 266:
                                            const onOffPluginUnit = new OnOffPluginUnit(
                                                uniqueId,
                                                type,
                                                nodeId,
                                                device.getNumber(),
                                                node,
                                                device,
                                                commissioningController,
                                                io
                                            );
                                            this.devices.push(onOffPluginUnit);
                                            devices.push(onOffPluginUnit);
                                            break;
                                        case 21:
                                            const contactSensor = new ContactSensor(
                                                uniqueId,
                                                type,
                                                nodeId,
                                                device.getNumber(),
                                                node,
                                                device,
                                                commissioningController,
                                                io
                                            );
                                            this.devices.push(contactSensor);
                                            devices.push(contactSensor);
                                            break;
                                        default:
                                            device.determineUniqueID()
                                            const unknownDevice = new BaseDevice(
                                                uniqueId,
                                                type,
                                                nodeId,
                                                device.getNumber(),
                                                node,
                                                device,
                                                commissioningController,
                                                io
                                            );
                                            this.devices.push(unknownDevice);
                                            devices.push(unknownDevice);
                                            break;
                                    }
                                }).catch((error) => {
                                    reject("Failed to get device type list: " + error);
                                });
                            }
                        });
                        resolve(devices);
                    }).catch((error) => {
                        reject("Failed to get unique ID: " + error);
                    });
                } else {
                    reject("Failed to get basic information");
                }
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

    public setPrivacyState(proxyId: number, state: PrivacyState) {
        this.devices.forEach((device) => {
            if (device.assignedProxy === proxyId) {
                device.setPrivacyState(state);
            }
        });
    }
}