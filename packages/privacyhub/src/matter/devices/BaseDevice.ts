import { PairedNode } from "@project-chip/matter-node.js/device";
import { Logger } from "@project-chip/matter-node.js/log";

export default class BaseDevice {
    protected pairedNode: PairedNode;
    protected logger: Logger;

    constructor(pairedNode: PairedNode) {
        this.pairedNode = pairedNode;
        this.logger = Logger.get("BaseDevice");
    }

    initialize = (): Promise<void> => {
        return Promise.resolve();
    }
}