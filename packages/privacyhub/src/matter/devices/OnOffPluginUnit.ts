import { PairedNode } from "@project-chip/matter-node.js/device";
import BaseDevice from "./BaseDevice.js";
import { OnOffCluster } from "@project-chip/matter.js/cluster";
import { Logger } from "@project-chip/matter-node.js/log";

export default class OnOffPluginUnit extends BaseDevice {
    private onOffCallback: (state: boolean) => void;

    constructor(pairedNode: PairedNode, onOffCallback: (state: boolean) => void) {
        super(pairedNode);
        this.onOffCallback = onOffCallback;
        this.logger = Logger.get("OnOffPluginUnit");
    }

    override initialize = (): Promise<void> => {
        return new Promise<void>((resolve, reject) => {
            const devices = this.pairedNode.getDevices();
            if (devices[0]) {
                const onOffCluster = devices[0].getClusterClient(OnOffCluster);
                if (onOffCluster !== undefined) {
                    onOffCluster.subscribeOnOffAttribute((state) => {
                        this.onOffCallback(state);
                    }, 1, 10).then(() => {
                        this.logger.debug(`Subscribed to OnOff attribute`);
                        resolve();
                    }).catch((error) => {
                        this.logger.error(`Failed to subscribe to OnOff attribute: ${error}`);
                        reject();
                    });
                } else {
                    this.logger.error(`Device does not have OnOff cluster`);
                    reject();
                }
            } else {
                this.logger.error(`Node has no devices`);
                reject();
            }
        });
    }
}