import ws281x from "rpi-ws281x-native";
import { Logger } from "@project-chip/matter-node.js/log";

enum LedState {
    OFF,
    LOADING,
    BLINKING,
    PULSING
}

interface LedStateOptions {
    color: number;
    tailLength?: number;
}

export default class NeoPixelController {
    private readonly logger: Logger;
    private readonly channel;
    private readonly colors;

    private readonly spinnerOptions

    private targetColor: number;
    private currentState;
    private switchingState;
    private busy;

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

        this.targetColor = 0x000000;
        this.currentState = LedState.OFF;
        this.switchingState = false;
        this.busy = false;

        this.displaySingleColor(this.rgbToHex(0, 0, 0))
        this.switchToState(LedState.LOADING, { color: this.rgbToHex(0, 0, 255) });
    }

    displaySingleColor(color: number) {
        this.targetColor = color;

        for (let i = 0; i < this.channel.count; i++) {
            this.colors[i] = color;
        }

        ws281x.render();
    }

    switchToState(newState: LedState, options: LedStateOptions) {
        this.switchingState = true;

        const lastState = this.currentState;
        this.currentState = newState;

        while (this.busy) {
            this.logger.debug("Waiting for previous state to finish...")
            setTimeout(() => {}, 100);
        }

        switch (lastState) {
            case LedState.OFF:
                this.switchFromOff(options);
                break;
            case LedState.LOADING:
                this.switchFromLoading(options);
                break;
            case LedState.BLINKING:
                this.switchFromBlinking(options);
                break;
            case LedState.PULSING:
                this.switchFromPulsing(options);
                break;

        }
    }

    switchFromOff(options: LedStateOptions) {
        switch (this.currentState) {
            case LedState.LOADING:
                this.switchingState = false;
                this.renderLoadingSpinner(options);
                break;
            case LedState.BLINKING:
                break;
            case LedState.PULSING:
                break;

        }
    }

    switchFromLoading(options: LedStateOptions) {

    }

    switchFromBlinking(options: LedStateOptions) {

    }

    switchFromPulsing(options: LedStateOptions) {

    }

    private renderLoadingSpinner(options: LedStateOptions, startTime?: number) {
        this.logger.debug("Rendering loading spinner...")
        this.busy = true;
        const hsvColor = this.hexToHsv(options.color);
        this.logger.debug(`HSV color: ${JSON.stringify(hsvColor)}`);
        this.logger.debug(`Tail length: ${this.spinnerOptions.tailLength}`);
        this.logger.debug(`Total channel count: ${this.channel.count}`);
        const start = startTime || Date.now();
        const durationPerIndex = this.spinnerOptions.rotationDuration / this.channel.count;
        const tailRotationPart = this.spinnerOptions.tailLength / this.channel.count;
        const spinnerInterval = setInterval(() => {
            const elapsed = Date.now() - start;
            for (let i = 0; i < this.channel.count; i++) {
                const relativeElapsed = (elapsed + durationPerIndex * i) % this.spinnerOptions.rotationDuration;
                // const currentRotation = 1 - relativeElapsed / this.spinnerOptions.rotationDuration;
                const currentRotation = relativeElapsed / this.spinnerOptions.rotationDuration;
                // map the currentRotation value (which is between 1 and 0) to the tailRotationPart so that value is 1 when currentRotation is 1 and linearly goes down to zero when currentRotation equals tailRotationPart
const value = hsvColor.v * Math.max(0, 1 - (currentRotation / tailRotationPart));
// const value = hsvColor.v * Math.max(0, (currentRotation * (1 + tailRotationPart)) - tailRotationPart);
                this.colors[i] = this.hsvToHex(hsvColor.h, hsvColor.s, value);
            }
            ws281x.render();

            if (this.currentState != LedState.LOADING || this.switchingState) {
                clearInterval(spinnerInterval);
                this.busy = false;
            }
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
        const b = (hex >> 16) & 255; // Extract blue value from leftmost byte
        const g = (hex >> 8) & 255;
        const r = hex & 255;

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