import { PairedNode, Endpoint } from "@project-chip/matter-node.js/device";
import { Logger } from "@project-chip/matter-node.js/log";
import { CommissioningController, MatterServer, NodeCommissioningOptions } from "@project-chip/matter-node.js";
import { NodeId } from "@project-chip/matter-node.js/datatype";
import { Server } from "socket.io";
import { CommissioningController } from "@project-chip/matter.js";
import { Logger } from "typedoc";
import { NodeId } from "@project-chip/matter.js/datatype";
import { type } from "typedoc/dist/lib/output/themes/default/partials/type.js";
import { resolve } from "eslint-import-resolver-typescript";
import * as console from "console";

export enum ConnectionStatus {
    CONNECTED,
    DISCONNECTED,
}

export enum PrivacyState {
    LOCAL_ONLY,
    REMOTE_ACCESS,
    ALL_ACCESS,
}

export default class BaseDevice {
    get nodeId(): string {
        return this._nodeId;
    }
    protected commissioningController: CommissioningController;
    protected io: Server;

    protected _nodeId: string;

    protected pairedNode: PairedNode;
    protected endpoint: Endpoint;
    protected logger: Logger;

    protected connectionStatus: ConnectionStatus = ConnectionStatus.DISCONNECTED;
    protected privacyState: PrivacyState = PrivacyState.LOCAL_ONLY;

    constructor(
        nodeId: string,
        pairedNode: PairedNode,
        endpoint: Endpoint,
        commissioningController: CommissioningController,
        io: Server
    ){
        this._nodeId = nodeId;
        this.pairedNode = pairedNode;
        this.endpoint = endpoint;
        this.commissioningController = commissioningController;
        this.io = io;
        this.logger = Logger.get("BaseDevice");

        this.initialize().then(() => {
            this.logger.info(`Initialized device ${this._nodeId}`);
            this.connectionStatus = this.pairedNode.isConnected ? ConnectionStatus.CONNECTED : ConnectionStatus.DISCONNECTED;
        }).catch((error) => {
            this.logger.error(`Failed to connect to node: ${error}`);
            this.connectionStatus = ConnectionStatus.DISCONNECTED;
        });
    }

    protected initialize(): Promise<void> {
        return Promise.resolve();
        // return new Promise<void>((resolve, reject) => {
        //     this.connectToNode().then(() => {
        //         // TODO check if connected
        //         this.connectionStatus = ConnectionStatus.CONNECTED;
        //         resolve();
        //     }).catch((error) => {
        //         this.connectionStatus = ConnectionStatus.DISCONNECTED;
        //         reject(error);
        //     });
        // });
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