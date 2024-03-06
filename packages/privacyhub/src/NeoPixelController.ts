import ws281x from "rpi-ws281x-native";
import { Logger } from "@project-chip/matter-node.js/log";

const logger = Logger.get("NeoPixelController");
logger.info("Starting NeoPixelController...");

const NUM_LEDS = 24;
const options = {
    dma: 10,
    freq: 800000,
    gpio: 18,
    invert: false,
    brightness: 100,
    stripType: ws281x.stripType.SK6812W
}

const channel = ws281x(NUM_LEDS, options);

const colors = channel.array;

for (let i = 0; i < channel.count; i++) {
    colors[i] = 0x22cc00;
}

ws281x.render();