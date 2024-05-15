import dotenv from "dotenv";
import mqtt, { MqttClient } from "mqtt";
import { Logger } from "@project-chip/matter-node.js/log";

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

if (!process.env.MQTT_USERNAME) {
    throw new Error("MQTT_USERNAME environment variable is not set");
}
const MQTT_USERNAME = process.env.MQTT_USERNAME;

if (!process.env.MQTT_PASSWORD) {
    throw new Error("MQTT_PASSWORD environment variable is not set");
}
const MQTT_PASSWORD = process.env.MQTT_PASSWORD;


export default class MqttManager {
    private client: MqttClient;

    constructor() {
        logger.info("Connecting to MQTT broker");
        this.client = mqtt.connect({
            host: MQTT_HOST,
            port: MQTT_PORT,
            username: MQTT_USERNAME,
            password: MQTT_PASSWORD
        });

        this.client.on("connect", () => {
            logger.info("Connected to MQTT broker");
        });

        this.client.on("error", (error) => {
            logger.error(`MQTT error: ${error}`);
        });

        this.client.on("message", (topic, message) => {
            logger.debug(`Received message on topic ${topic}: ${message}`);
        });
    }

    public publish = (topic: string, message: string): void => {
        this.client.publish(topic, message);
    }

    public subscribe = (topic: string): void => {
        this.client.subscribe(topic);
    }
}