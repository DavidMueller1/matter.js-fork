import { NodeId, DeviceTypeId } from "@project-chip/matter-node.js/datatype";
import { ServerNode } from "@project-chip/matter.js/node";
import { PairedNode } from "@project-chip/matter-node.js/device";
import { BasicInformationCluster } from "@project-chip/matter-node.js/cluster";
import { Logger } from "@project-chip/matter-node.js/log";
// import { EventEmitter } from "events";

export default abstract class VirtualBaseDevice {
    protected _nodeId: NodeId;
    protected _type: DeviceTypeId;

    vendorName: string | undefined;
    vendorId: number | undefined;
    nodeLabel: string | undefined;
    productName: string | undefined;
    productLabel: string | undefined;
    productId: number | undefined;
    serialNumber: string | undefined;
    uniqueId: string | undefined;

    protected existingNode: PairedNode
    protected serverNode: ServerNode | undefined;

    // protected eventEmitter: EventEmitter = new EventEmitter();

    protected logger: Logger;

    protected constructor(
        nodeId: NodeId,
        type: DeviceTypeId,
        existingNode: PairedNode
    ) {
        this._nodeId = nodeId;
        this._type = type;
        this.existingNode = existingNode;

        this.logger = Logger.get("VirtualDevice");

        this.getBasicInformation().then(() => {
            this.logger.info("Successfully got basic information");
            this.initializeVirtualDevice().then(() => {
                this.logger.info("Successfully initialized virtual device");
            }).catch((error) => {
                this.logger.error(`Failed to initialize virtual device: ${error}`);
            });
        }).catch((error) => {
            this.logger.error(`Failed to get basic information: ${error}`);
        });
    }

    get nodeId() {
        return this._nodeId;
    }

    getBasicInformation(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const basicInformationCluster = this.existingNode.getRootClusterClient(BasicInformationCluster);
            if (basicInformationCluster === undefined) {
                return reject("Failed to get BasicInformationCluster");
            }
            basicInformationCluster.attributes.vendorName.get()
                .then((vendorName) => {
                    this.vendorName = vendorName;
                    return basicInformationCluster.attributes.vendorId.get();
                }).then((vendorId) => {
                    this.vendorId = vendorId;
                    return basicInformationCluster.attributes.nodeLabel.get();
                }).then((nodeLabel) => {
                    this.nodeLabel = nodeLabel;
                    return basicInformationCluster.attributes.productName.get();
                }).then((productName) => {
                    this.productName = productName;
                    return basicInformationCluster.attributes.productLabel.get();
                }).then((productLabel) => {
                    this.productLabel = productLabel;
                    return basicInformationCluster.attributes.productId.get();
                }).then((productId) => {
                    this.productId = productId;
                    return basicInformationCluster.attributes.serialNumber.get();
                }).then((serialNumber) => {
                    this.serialNumber = serialNumber;
                    return basicInformationCluster.attributes.uniqueId.get();
                }).then((uniqueId) => {
                    this.uniqueId = uniqueId;
                    resolve();
                }).catch((error) => {
                    reject(error);
                });
        });
    }

    abstract initializeVirtualDevice(): Promise<void>
}