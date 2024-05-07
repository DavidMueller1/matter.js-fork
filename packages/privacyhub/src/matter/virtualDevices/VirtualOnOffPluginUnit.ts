import { NodeId, DeviceTypeId } from "@project-chip/matter-node.js/datatype";
import { ServerNode } from "@project-chip/matter.js/node";
import { Endpoint } from "@project-chip/matter.js/endpoint";
import { PairedNode } from "@project-chip/matter-node.js/device";
import { OnOffPlugInUnitDevice } from "@project-chip/matter.js/devices/OnOffPlugInUnitDevice";
import VirtualBaseDevice from "./VirtualBaseDevice.js";

export default class VirtualOnOffPluginUnit extends VirtualBaseDevice {
    private endpoint: Endpoint<OnOffPlugInUnitDevice> | undefined;

    constructor(
        nodeId: NodeId,
        type: DeviceTypeId,
        existingNode: PairedNode
    ) {
        super(
            nodeId,
            type,
            existingNode
        );
    }

    override initializeVirtualDevice(): Promise<void> {
        this.logger.info("Initializing Virtual OnOffPluginUnit");
        return new Promise<void>((resolve, reject) => {
            ServerNode.create({
                id: this.uniqueId,

                // Provide Network relevant configuration like the port
                // Optional when operating only one device on a host, Default port is 5540
                // network: {
                //     port, // TODO
                // },

                // Provide Commissioning relevant settings
                // Optional for development/testing purposes
                commissioning: {
                    passcode: 123456,
                    discriminator: 19,
                },

                // Provide Node announcement settings
                // Optional: If Ommitted some development defaults are used
                productDescription: {
                    name: this.productName,
                    deviceType: DeviceTypeId(OnOffPlugInUnitDevice.deviceType),
                },

                // Provide defaults for the BasicInformation cluster on the Root endpoint
                // Optional: If Omitted some development defaults are used
                basicInformation: {
                    vendorName: this.vendorName,
                    vendorId: this.vendorId,
                    nodeLabel: this.nodeLabel,
                    productName: this.productName,
                    productLabel: this.productLabel,
                    productId: this.productId,
                    serialNumber: this.serialNumber,
                    uniqueId: this.uniqueId,
                },
            }).then((serverNode) => {
                this.logger.info("ServerNode created");
                this.serverNode = serverNode;
                this.endpoint = new Endpoint(
                    OnOffPlugInUnitDevice,
                    {
                        id: this.uniqueId,
                    }
                )
                return this.serverNode.add(endpoint);
            }).then((endpoint) => {
                this.logger.info("Endpoint added");
                endpoint.events.onOff.onOff$Changed.on(value => {
                    console.log(`OnOff is now ${value ? "ON" : "OFF"}`);
                });
                return this.serverNode?.run();
            }).then(() => {
                this.logger.info("ServerNode running");
                resolve();
            }).catch((error) => {
                return reject(error);
            });
        });
    }

    setOnOffState(state: boolean) {
        this.logger.info(`==============Setting OnOff of virtual device to ${state}`);
        this.endpoint?.set({
            onOff: {
                onOff: state,
            }
        }).then(() => {
            this.logger.info(`Set OnOff of virtual device to ${state}`);
        }).catch((error) => {
            this.logger.error(`Failed to set OnOff of virtual device: ${error}`);
        });
    }
}