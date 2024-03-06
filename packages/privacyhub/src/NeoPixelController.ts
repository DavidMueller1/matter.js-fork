import ws281x from "rpi-ws281x-native";
import { Logger } from "@project-chip/matter-node.js/log";

export default class NeoPixelController {
    private readonly logger: Logger;
    private readonly channel;
    private readonly colors;

    constructor() {
        this.logger = Logger.get("NeoPixelController");
        this.logger.debug("Setup NeoPixelController...")

        const NUM_LEDS = parseInt(process.env.NUM_LEDS || "24");
        const options = {
            dma: 10,
            freq: 800000,
            gpio: 18,
            invert: false,
            brightness: 100,
            stripType: ws281x.stripType.SK6812W
        }
        this.channel = ws281x(NUM_LEDS, options);
        this.colors = this.channel.array;

        this.displaySingleColor(this.rgbToHexNumber(0, 0, 255))
    }

    displaySingleColor(color: number) {
        for (let i = 0; i < this.channel.count; i++) {
            this.colors[i] = color;
        }

        ws281x.render();
    }

    private rgbToHexNumber(r: number, g: number, b: number): number {
        return (b << 16) + (g << 8) + r;
    }

    private hslToHexNumber(h: number, s: number, l: number): number {
        const hue = h / 360;
        const hueToRgb = (p: number, q: number, t: number): number => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };

        let r, g, b;

        if (s === 0) {
            r = g = b = l;
        } else {
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hueToRgb(p, q, hue + 1 / 3);
            g = hueToRgb(p, q, hue);
            b = hueToRgb(p, q, hue - 1 / 3);
        }

        return (Math.round(b * 255) << 16) + (Math.round(g * 255) << 8) + Math.round(r * 255);
    }
}