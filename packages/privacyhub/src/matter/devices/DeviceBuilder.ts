import { CommissioningController } from "@project-chip/matter.js";
import { Server } from "socket.io";
import { PairedNode } from "@project-chip/matter-node.js/device";
import { NodeId } from "@project-chip/matter-node.js/datatype";
import OnOffPluginUnit from "./OnOffPluginUnit.js";
import BaseDevice from "./BaseDevice.js";

export default class DeviceBuilder {
    static generateDevices = (nodeId: NodeId, commissioningController: CommissioningController, io: Server): Promise<BaseDevice[]> => {
        return new Promise<BaseDevice[]>((resolve, reject) => {
            commissioningController.connectNode(nodeId).then((node: PairedNode) => {
                const devices: BaseDevice[] = [];
                node.getDevices().forEach((device) => {
                    const type = device.getDeviceTypes()[0];
                    switch (type.code) {
                        case 266:
                            devices.push(new OnOffPluginUnit(nodeId, node, device, commissioningController, io));
                            break;
                        default:
                            devices.push(new BaseDevice(nodeId, node, device, commissioningController, io));
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
}