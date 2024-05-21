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

const SET_STATE_TOPIC = "set_state_proxy_";
const IS_STATE_TOPIC = "is_state_proxy_";
// const DATA_TOPIC = "data_proxy_";

export interface DataUpdate {
    from: number;
    to: number;
}




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
                const state = parseInt(messageArray[3]);
                if (isNaN(state) || state < 0 || state > PrivacyState.THIRD_PARTY) {
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

    private subscribeToProxies = (): void => {
        for (let i = 1; i <= this.numProxies; i++) {
            const setStateTopic = SET_STATE_TOPIC + i;
            this.subscribe(setStateTopic);
        }
    }

    public publishPrivacyStateUpdate = (proxyId: number, newPrivacyState: PrivacyState): void => {
        logger.debug(`Publishing privacy state update for proxy ${proxyId}: ${newPrivacyState}`);
        const message = `${newPrivacyState}`;
        this.client.publish(IS_STATE_TOPIC + proxyId, message, { retain: true });
    }
}