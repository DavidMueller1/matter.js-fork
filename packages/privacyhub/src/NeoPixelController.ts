import ws281x from "rpi-ws281x-native";
import { Logger } from "@project-chip/matter-node.js/log";

const logger = Logger.get("NeoPixelController");
logger.info("Starting NeoPixelController...");

const NUM_LEDS = 10;
const options = {
    freq: 800000,
    gpio: 17,
    invert: false,
    brightness: 255,
    stripType: ws281x.stripType.WS2812
}

const channel = ws281x(NUM_LEDS, options);

const colorArray = channel.array;

for (let i = 0; i < channel.count; i++) {
    colorArray[i] = 0xffcc22;
}

ws281x.render();