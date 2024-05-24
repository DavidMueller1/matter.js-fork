import { NodeId, DeviceTypeId } from "@project-chip/matter-node.js/datatype";
import { ServerNode } from "@project-chip/matter.js/node";
import { Endpoint } from "@project-chip/matter.js/endpoint";
import { PairedNode } from "@project-chip/matter-node.js/device";
import { ContactSensorDevice } from "@project-chip/matter.js/devices/ContactSensorDevice";
import VirtualBaseDevice from "./VirtualBaseDevice.js";
import { Logger } from "@project-chip/matter-node.js/log";

const logger = Logger.get("VirtualContactSensor");

export default class VirtualContactSensor extends VirtualBaseDevice {
    private endpoint: Endpoint<ContactSensorDevice> | undefined;
    private contactEventCallback: (state: boolean) => void;

    private constructor(
        nodeId: NodeId,
        type: DeviceTypeId,
        existingNode: PairedNode,
        contactEventCallback: (state: boolean) => void
    ) {
        super(
            nodeId,
            type,
            existingNode
        );
        this.contactEventCallback = contactEventCallback;
    }

    static async create(
        nodeId: NodeId,
        type: DeviceTypeId,
        existingNode: PairedNode,
        contactEventCallback: (state: boolean) => void
    ): Promise<VirtualContactSensor> {
        const virtualDevice = new VirtualContactSensor(
            nodeId,
            type,
            existingNode,
            contactEventCallback
        );
        await virtualDevice.setup();
        return virtualDevice;
    }

    override initializeVirtualDevice(): Promise<void> {
        logger.info("Initializing Virtual ContactSensor");
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
                    deviceType: DeviceTypeId(ContactSensorDevice.deviceType),
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
                    ContactSensorDevice,
                    {
                        id: this.uniqueId,
                    }
                )
                return this.serverNode.add(this.endpoint);
            }).then((endpoint) => {
                logger.info("Endpoint added");
                endpoint.events.booleanState.stateValue$Changed.on(value => {
                    logger.info(`Boolean State is now ${value}`);
                    this.contactEventCallback(value);
                });
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

    setContactState(state: boolean) {
        this.endpoint?.set({
            booleanState: {
                stateValue: state,
            }
        }).then(() => {
            logger.info(`Set Boolean State to ${state}`);
        }).catch((error) => {
            logger.error(`Failed to set Boolean State to ${state}: ${error}`);
        });
    }

    override getTypeCode(): number {
        return 21;
    }
}