import { NodeId, DeviceTypeId } from "@project-chip/matter-node.js/datatype";
import { ServerNode } from "@project-chip/matter.js/node";
import { PairedNode } from "@project-chip/matter-node.js/device";
import { BasicInformationCluster } from "@project-chip/matter-node.js/cluster";
import { Logger } from "@project-chip/matter-node.js/log";
import {
    CommissioningFlowType,
    DiscoveryCapabilitiesSchema,
    ManualPairingCodeCodec,
    QrPairingCodeCodec,
} from "@project-chip/matter-node.js/schema";
// import { EventEmitter } from "events";

export default abstract class VirtualBaseDevice {
    protected _nodeId: NodeId;
    protected _type: DeviceTypeId;

    protected isActive: boolean = false;

    protected vendorName: string | undefined;
    protected vendorId: number | undefined;
    protected nodeLabel: string | undefined;
    protected productName: string | undefined;
    protected productLabel: string | undefined;
    protected productId: number | undefined;
    protected serialNumber: string | undefined;
    protected uniqueId: string | undefined;

    protected discriminator: number;
    protected passcode: number;

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

        this.discriminator = this.getTypeCode() * 10 + Math.floor(Math.random() * 10);
        this.passcode = this.generatePasscode();

        this.logger = Logger.get("VirtualDevice");
    }

    protected setup(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.getBasicInformation().then(() => {
                this.logger.info("Successfully got basic information");
                this.initializeVirtualDevice().then(() => {
                    this.logger.info("Successfully initialized virtual device");
                    resolve();
                }).catch((error) => {
                    this.logger.error(`Failed to initialize virtual device: ${error}`);
                    reject(error);
                });
            }).catch((error) => {
                this.logger.error(`Failed to get basic information: ${error}`);
                reject(error);
            });
        });
    }

    get nodeId() {
        return this._nodeId;
    }

    protected getBasicInformation(): Promise<void> {
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

    protected generatePasscode(): number {
        return Math.floor(Math.random() * 90000000) + 10000000;
    }

    getManualPairingCode(): string {
        return ManualPairingCodeCodec.encode({
            discriminator: this.discriminator,
            passcode: this.passcode,
        });
    }

    getQRCode(): string {
        return QrPairingCodeCodec.encode({
            version: 0,
            vendorId: this.vendorId || 0,
            productId: this.productId || 0,
            flowType: CommissioningFlowType.Standard,
            discriminator: this.discriminator,
            passcode: this.passcode,
            discoveryCapabilities: DiscoveryCapabilitiesSchema.encode({
                onIpNetwork: true,
            }),
        });
    }

    public start(): void {
        this.logger.debug(`Starting ServerNode for ${this.productName}`);

        if (this.isActive) {
            return;
        }

        if (this.serverNode !== undefined) {
            this.serverNode.start();
            this.isActive = true;
        } else {
            this.logger.error(`Server Node for ${this.productName} is not initialized`);
        }
    }

    public stop(): void {
        this.logger.debug(`Stopping ServerNode for ${this.productName}`);

        if (!this.isActive) {
            return;
        }

        if (this.serverNode !== undefined) {
            this.serverNode.cancel();
            this.isActive = false;
        } else {
            this.logger.error(`Server Node for ${this.productName} is not initialized`);
        }
    }

    abstract getTypeCode(): number

    protected abstract initializeVirtualDevice(): Promise<void>
}