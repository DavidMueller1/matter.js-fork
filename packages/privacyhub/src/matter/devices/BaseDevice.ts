import { PairedNode } from "@project-chip/matter-node.js/device";
import { Logger } from "@project-chip/matter-node.js/log";

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
    protected pairedNode: PairedNode;
    protected logger: Logger;

    protected connectionStatus: ConnectionStatus = ConnectionStatus.DISCONNECTED;
    protected privacyState: PrivacyState = PrivacyState.LOCAL_ONLY;

    constructor(pairedNode: PairedNode) {
        this.pairedNode = pairedNode;
        this.logger = Logger.get("BaseDevice");
    }

    static getDeviceObject = (nodeId: string, deviceType: number) => {
        switch (deviceType) {
            case 0:
                return new BaseDevice(nodeId);
            case 1:
                return new OnOffPluginUnit(nodeId);
            default:
                return new BaseDevice(nodeId);
        }
    }

    initialize = (): Promise<void> => {
        return Promise.resolve();
    }
}