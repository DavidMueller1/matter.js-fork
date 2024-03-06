import ws281x from "rpi-ws281x-native";
import { Logger } from "@project-chip/matter-node.js/log";

export default class NeoPixelController {
    private readonly logger: Logger;
    private readonly channel;
    private readonly colors;

    private readonly spinnerOptions

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

        this.spinnerOptions = {
            rotationDuration: parseInt(process.env.SPINNER_ROTATION_DURATION || "1000"),
            framesPerSecond: parseInt(process.env.SPINNER_FRAMES_PER_SECOND || "100"),
            tailLength: parseInt(process.env.SPINNER_TAIL_LENGTH || "10"),
        }

        // this.displaySingleColor(this.rgbToHex(0, 0, 255))
        this.renderLoadingSpinner(this.rgbToHex(0, 0, 255))
    }

    displaySingleColor(color: number) {
        for (let i = 0; i < this.channel.count; i++) {
            this.colors[i] = color;
        }

        ws281x.render();
    }

    private renderLoadingSpinner(color: number) {
        this.logger.debug("Rendering loading spinner...")

        const hsvColor = this.hexToHsv(color);
        const start = Date.now();
        const durationPerIndex = this.spinnerOptions.rotationDuration / this.channel.count;
        const tailRotationPart = this.spinnerOptions.tailLength / this.channel.count;
        const spinnerInterval = setInterval(() => {
            const elapsed = Date.now() - start;
            // const rotation = (elapsed % this.spinnerOptions.rotationDuration) / this.spinnerOptions.rotationDuration;
            for (let i = 0; i < this.channel.count; i++) {
                const relativeElapsed = (elapsed + durationPerIndex * i) % this.spinnerOptions.rotationDuration;
                // Adjust value based on relative elapsed time and tail length
                const value = hsvColor.v * Math.max(0, (relativeElapsed / this.spinnerOptions.rotationDuration) - tailRotationPart);
                this.colors[i] = this.hsvToHex(hsvColor.h, hsvColor.s, value);
            }
            ws281x.render();
        });

    }

    private rgbToHex(r: number, g: number, b: number): number {
        return (b << 16) + (g << 8) + r;
    }

    private hexToRgb(hex: number): { r: number; g: number; b: number } {
        const r = (hex >> 16) & 255;
        const g = (hex >> 8) & 255;
        const b = hex & 255;
        return { r, g, b };
    }

    private hsvToHex(h: number, s: number, v: number): number {
        const c = v * s;
        const x = c * (1 - Math.abs((h / 60) % 2 - 1));
        const m = v - c;

        let r = 0, g = 0, b = 0;

        if (h >= 0 && h < 60) {
            r = c; g = x; b = 0;
        } else if (h >= 60 && h < 120) {
            r = x; g = c; b = 0;
        } else if (h >= 120 && h < 180) {
            r = 0; g = c; b = x;
        } else if (h >= 180 && h < 240) {
            r = 0; g = x; b = c;
        } else if (h >= 240 && h < 300) {
            r = x; g = 0; b = c;
        } else if (h >= 300 && h < 360) {
            r = c; g = 0; b = x;
        }

        const red = Math.round((r + m) * 255);
        const green = Math.round((g + m) * 255);
        const blue = Math.round((b + m) * 255);

        return (blue << 16) + (green << 8) + red;
    }

    private hexToHsv(hex: number): { h: number; s: number; v: number } {
        const r = (hex >> 16) & 255;
        const g = (hex >> 8) & 255;
        const b = hex & 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const delta = max - min;

        let h = 0, s = 0, v = max / 255;

        if (delta !== 0) {
            if (max === r) h = (g - b) / delta % 6;
            if (max === g) h = (b - r) / delta + 2;
            if (max === b) h = (r - g) / delta + 4;

            s = delta / max;
        }

        h *= 60;
        if (h < 0) h += 360;

        return { h, s, v };
    }
}