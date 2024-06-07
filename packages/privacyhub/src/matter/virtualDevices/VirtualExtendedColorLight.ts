import { NodeId, DeviceTypeId } from "@project-chip/matter-node.js/datatype";
import { ServerNode } from "@project-chip/matter.js/node";
import { Endpoint } from "@project-chip/matter.js/endpoint";
import { PairedNode } from "@project-chip/matter-node.js/device";
import VirtualBaseDevice from "./VirtualBaseDevice.js";
import { Logger } from "@project-chip/matter-node.js/log";
import { ExtendedColorLightDevice } from "@project-chip/matter.js/devices/ExtendedColorLightDevice";

const logger = Logger.get("VirtualExtendedColorLight");

export default class VirtualExtendedColorLight extends VirtualBaseDevice {
    private endpoint: Endpoint<ExtendedColorLightDevice> | undefined;
    private onOffEventCallback: (state: boolean) => void;
    // @ts-expect-error No implemented yet
    private levelEventCallback: (level: number) => void;
    // @ts-expect-error No implemented yet
    private colorEventCallback: (hue: number, saturation: number) => void;

    private constructor(
        nodeId: NodeId,
        type: DeviceTypeId,
        existingNode: PairedNode,
        onOffEventCallback: (state: boolean) => void,
        levelEventCallback: (level: number) => void,
        colorEventCallback: (hue: number, saturation: number) => void
    ) {
        super(
            nodeId,
            type,
            existingNode
        );
        this.onOffEventCallback = onOffEventCallback;
        this.levelEventCallback = levelEventCallback;
        this.colorEventCallback = colorEventCallback;
    }

    static async create(
        nodeId: NodeId,
        type: DeviceTypeId,
        existingNode: PairedNode,
        onOffEventCallback: (state: boolean) => void,
        levelEventCallback: (level: number) => void,
        colorEventCallback: (hue: number, saturation: number) => void
    ): Promise<VirtualExtendedColorLight> {
        const virtualDevice = new VirtualExtendedColorLight(
            nodeId,
            type,
            existingNode,
            onOffEventCallback,
            levelEventCallback,
            colorEventCallback
        );
        await virtualDevice.setup();
        return virtualDevice;
    }

    override initializeVirtualDevice(): Promise<void> {
        logger.info("Initializing Virtual ExtendedColorLight");
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
                    passcode: this.passcode,
                    discriminator: this.discriminator,
                },

                // Provide Node announcement settings
                // Optional: If Ommitted some development defaults are used
                productDescription: {
                    name: this.productName,
                    deviceType: DeviceTypeId(ExtendedColorLightDevice.deviceType),
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
                logger.info("ServerNode created");
                this.serverNode = serverNode;
                this.endpoint = new Endpoint(
                    ExtendedColorLightDevice,
                    {
                        id: this.uniqueId,
                    }
                )
                return this.serverNode.add(this.endpoint);
            }).then((endpoint) => {
                logger.info("Endpoint added");
                endpoint.events.onOff.onOff$Changed.on(value => {
                    logger.info(`OnOff is now ${value ? "ON" : "OFF"}`);
                    this.onOffEventCallback(value);
                });
                logger.info("=============== EVENTS");
                logger.info(endpoint.events.toString());
                // return this.serverNode?.factoryReset();
                logger.info(`Running Server Node ${this.serverNode?.id}`);
                resolve();
                // return this.serverNode?.run();
            }).then(() => {
                logger.info("ServerNode running");
            }).catch((error) => {
                return reject(error);
            });
        });
    }

    override getTypeCode(): number {
        return 266;
    }

    setOnOffState(state: boolean) {
        this.endpoint?.set({
            onOff: {
                onOff: state,
            }
        }).then(() => {
            logger.info(`Set OnOff of virtual device to ${state}`);
        }).catch((error) => {
            logger.error(`Failed to set OnOff of virtual device: ${error}`);
        });
    }
}