import dotenv from "dotenv";
import mqtt, { MqttClient } from "mqtt";
import { Logger } from "@project-chip/matter-node.js/log";
import { PrivacyState } from "../matter/devices/BaseDevice.js";

const logger = Logger.get("MqttManager");

// Load environment variables from .env file
dotenv.config();

if (!process.env.MQTT_HOST) {
    throw new Error("MQTT_HOST environment variable is not set");
}
const MQTT_HOST = process.env.MQTT_HOST;

if (!process.env.MQTT_PORT) {
    throw new Error("MQTT_PORT environment variable is not set");
}
const MQTT_PORT = parseInt(process.env.MQTT_PORT);

// if (!process.env.MQTT_USERNAME) {
//     throw new Error("MQTT_USERNAME environment variable is not set");
// }
const MQTT_USERNAME = process.env.MQTT_USERNAME || "";

// if (!process.env.MQTT_PASSWORD) {
//     throw new Error("MQTT_PASSWORD environment variable is not set");
// }
const MQTT_PASSWORD = process.env.MQTT_PASSWORD || "";

if (!process.env.NUM_PROXIES) {
    throw new Error("NUM_PROXIES environment variable is not set");
}
const NUM_PROXIES = process.env.NUM_PROXIES;

const SET_STATE_TOPIC = "proxy_state_update_proxy_";
const IS_STATE_TOPIC = "hub_state_update_proxy_";
const DATA_TOPIC = "dashboardAnimations";
const PROXY_LOCATION_UPDATE_TOPIC = "dashboardOverride"


export default class MqttManager {
    private client: MqttClient;
    private readonly numProxies: number;
    private readonly setStateCallback: (proxyId: number, state: PrivacyState) => void;

    constructor(
        setStateCallback?: (proxyId: number, state: PrivacyState) => void
    ){
        logger.info("Starting MQTT manager");

        this.numProxies = parseInt(NUM_PROXIES);
        this.setStateCallback = ((proxyId: number, state: PrivacyState) => {
            logger.debug(`Received state update for proxy ${proxyId}: ${state}`);
            if (setStateCallback) {
                setStateCallback(proxyId, state);
                this.publishPrivacyStateUpdate(proxyId, state);
            }
        });

        this.client = mqtt.connect({
            host: MQTT_HOST,
            port: MQTT_PORT,
            username: MQTT_USERNAME,
            password: MQTT_PASSWORD
        });

        this.client.on("connect", () => {
            logger.info("Connected to MQTT broker");
            this.subscribeToProxies();
        });

        this.client.on("error", (error) => {
            logger.error(`MQTT error: ${error}`);
        });

        this.client.on("message", (topic, message) => {
            logger.debug(`Received message on topic ${topic}: ${message}`);

            // Check if the topic is a set state topic
            if (topic.startsWith(SET_STATE_TOPIC)) {
                const proxy = parseInt(topic.substring(SET_STATE_TOPIC.length));
                if (isNaN(proxy) || proxy < 1 || proxy > this.numProxies) {
                    logger.error(`Invalid proxy number: ${proxy}`);
                    return;
                }

                const messageArray = message.toString().split(",");
                if (messageArray[3] === undefined || messageArray[3] === "x") {
                    return;
                }
                const state = parseInt(messageArray[3]);
                if (isNaN(state) || state < 0 || state > PrivacyState.ONLINE) {
                    logger.error(`Invalid state: ${state}`);
                    return;
                }
                this.setStateCallback(proxy, state);
            }
        });
    }

    public publish = (topic: string, message: string): void => {
        this.client.publish(topic, message);
    }

    public subscribe = (topic: string): void => {
        this.client.subscribe(topic);
    }

    /**
     * Subscribes to all proxy privacy state update topics
     */
    private subscribeToProxies = (): void => {
        for (let i = 1; i <= this.numProxies; i++) {
            const setStateTopic = SET_STATE_TOPIC + i;
            this.subscribe(setStateTopic);
        }
    }

    public publishProxyLocationUpdate = (proxyId: number, row: number, col: number): void => {
        logger.debug(`Publishing proxy location update for proxy ${proxyId}: ${col},${row}`);
        const message = `${proxyId},${row},${col}`;

        this.client.publish(PROXY_LOCATION_UPDATE_TOPIC, message);
    }

    /**
     * Publishes a privacy state update to the MQTT broker
     * @param proxyId The ID of the affected proxy
     * @param newPrivacyState The new privacy state
     */
    public publishPrivacyStateUpdate = (proxyId: number, newPrivacyState: PrivacyState): void => {
        logger.debug(`Publishing privacy state update for proxy ${proxyId}: ${newPrivacyState}`);
        const message = `${newPrivacyState}`;

        this.client.publish(IS_STATE_TOPIC + proxyId, message, { retain: true });
    }

    /**
     * Publishes a data update to the MQTT broker for data flow visualization
     * @param proxyId The ID of the involved proxy
     * @param outgoingFromHub Whether the data is flowing out from the hub or into the hub
     */
    public publishDataUpdate = (proxyId: number, outgoingFromHub: boolean): void => {
        logger.info(`Publishing data update for proxy ${proxyId}: ${outgoingFromHub ? "outgoing" : "incoming"}`);
        const from = outgoingFromHub ? 0 : proxyId;
        const to = outgoingFromHub ? proxyId : 0;
        const message = `${from},${to}`;

        this.client.publish(DATA_TOPIC, message);
    }
}