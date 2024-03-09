import ws281x from "rpi-ws281x-native";
import { Logger } from "@project-chip/matter-node.js/log";
import { mod } from "./Util.js";

export enum LedState {
    OFF,
    SINGLE,
    LOADING,
    BLINKING,
    PULSING
}

export interface LedStateOptions {
    color: number;
    tailLength?: number;
    blinkDuration?: number;
    blinkCount?: number;
}

export default class NeoPixelController {
    private readonly logger: Logger;
    private readonly channel;
    private readonly colors;

    private readonly spinnerOptions;
    private readonly fadeOptions;

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
            tailLength: parseInt(process.env.SPINNER_TAIL_LENGTH || "12"),
        }

        this.fadeOptions = {
            duration: parseInt(process.env.FADE_DURATION || "1000"),
        }

        this.targetColor = 0x000000;
        this.currentState = LedState.OFF;
        this.switchingState = false;
        this.busy = false;

        this.displaySingleColor({ color: NeoPixelController.rgbToHex(0, 0, 0) });

        // this.switchToState(LedState.LOADING, { color: NeoPixelController.rgbToHex(100, 0, 255) });
        // // switch to single color red after 5 seconds
        // setTimeout(() => {
        //     this.switchToState(LedState.SINGLE, { color: NeoPixelController.rgbToHex(0, 255, 0) });
        //     setTimeout(() => {
        //         this.switchToState(LedState.LOADING, { color: NeoPixelController.rgbToHex(255, 100, 0) });
        //         setTimeout(() => {
        //             this.switchToState(LedState.OFF, { color: NeoPixelController.rgbToHex(0, 0, 0) });
        //         }, 5000);
        //     }, 5000);
        // }, 5000);
    }

    displaySingleColor(options: LedStateOptions) {
        this.targetColor = options.color;

        for (let i = 0; i < this.channel.count; i++) {
            this.colors[i] = this.targetColor;
        }

        ws281x.render();
    }

    switchToState(newState: LedState, options: LedStateOptions) {
        this.logger.debug(`Switching to state: ${LedState[newState]}`);
        // this.targetColor = options.color;
        // this.switchingState = true;

        const lastState = this.currentState;
        this.currentState = newState;

        this.waitForStateSwitch().then(() => {
            this.targetColor = options.color;
            this.switchingState = true;
            switch (lastState) {
                case LedState.OFF:
                    this.switchFromOff(options);
                    break;
                case LedState.SINGLE:
                    this.switchFromSingle(options);
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
        }).catch((_) => {});
    }

    switchFromOff(options: LedStateOptions) {
        this.logger.debug(`Switching from off: ${JSON.stringify(options)}`);
        switch (this.currentState) {
            case LedState.SINGLE:
                this.fadeToColor(options, this.fadeOptions.duration)
                this.waitUntilNotBusy().then(() => {
                    this.switchingState = false;
                }).catch((_) => {});
                break;
            case LedState.LOADING:
                this.renderLoadingSpinner(options, undefined, true);
                break;
            case LedState.BLINKING:
                this.renderBlinking(options)
                break;
            case LedState.PULSING:
                // TODO: implement
                break;

        }
    }

    switchFromSingle(options: LedStateOptions) {
        this.logger.debug(`Switching from single: ${JSON.stringify(options)}`);
        switch (this.currentState) {
            case LedState.OFF:
                this.fadeToColor({ color: 0x000000 }, this.fadeOptions.duration)
                this.waitUntilNotBusy().then(() => {
                    this.switchingState = false;
                }).catch((_) => {});
                break;
            case LedState.SINGLE:
                this.fadeToColor(options, this.fadeOptions.duration)
                this.waitUntilNotBusy().then(() => {
                    this.switchingState = false;
                }).catch((_) => {});
                break;
            case LedState.LOADING:
                this.renderLoadingSpinner(options, undefined, true);
                break;
            case LedState.BLINKING:
                this.renderBlinking(options)
                break;
            case LedState.PULSING:
                // TODO: implement
                break;

        }
    }

    switchFromLoading(options: LedStateOptions) {
        this.logger.debug(`Switching from loading: ${JSON.stringify(options)}`);
        switch (this.currentState) {
            case LedState.OFF:
                this.targetColor = 0x000000;
                this.waitUntilNotBusy().then(() => {
                    this.displaySingleColor({ color: 0x000000 });
                    this.switchingState = false;
                }).catch((_) => {});
                break;
            case LedState.SINGLE:
                this.waitUntilNotBusy().then(() => {
                    this.displaySingleColor(options)
                    this.switchingState = false;
                }).catch((_) => {});
                break;
            case LedState.LOADING:
                this.targetColor = options.color;
                this.switchingState = true;
                break;
            case LedState.BLINKING:
                this.renderBlinking(options)
                break;
            case LedState.PULSING:
                // TODO: implement
                break;

        }
    }

    switchFromBlinking(options: LedStateOptions) {
        // TODO: implement
    }

    switchFromPulsing(options: LedStateOptions) {
        // TODO: implement
    }

    private renderLoadingSpinner(options: LedStateOptions, startTime?: number, spinupEffect = false) {
        this.logger.debug("Rendering loading spinner...")
        this.busy = true;
        let hsvColor = NeoPixelController.hexToHsv(options.color);
        this.logger.debug(`HSV color: ${JSON.stringify(hsvColor)}`);
        this.logger.debug(`Tail length: ${this.spinnerOptions.tailLength}`);
        this.logger.debug(`Total channel count: ${this.channel.count}`);
        const start = startTime || Date.now();
        const durationPerIndex = this.spinnerOptions.rotationDuration / this.channel.count;
        const tailRotationPart = this.spinnerOptions.tailLength / this.channel.count;

        if (spinupEffect) {
            let spinupElapsed = Date.now() - start;
            while (spinupElapsed < this.spinnerOptions.rotationDuration) {
                spinupElapsed = Date.now() - start;
                for (let i = 0; i < this.channel.count; i++) {
                    if (spinupElapsed < this.spinnerOptions.rotationDuration - i * durationPerIndex) continue;
                    const relativeElapsed = (spinupElapsed + durationPerIndex * i) % this.spinnerOptions.rotationDuration;
                    const currentRotation = relativeElapsed / this.spinnerOptions.rotationDuration;
                    const value = hsvColor.v * Math.max(0, 1 - (currentRotation / tailRotationPart));
                    this.colors[i] = NeoPixelController.hsvToHex(hsvColor.h, hsvColor.s, value);
                }
                ws281x.render();
            }
            this.switchingState = false;
        }

        const spinnerInterval = setInterval(() => {
            const elapsed = Date.now() - start;

            for (let i = 0; i < this.channel.count; i++) {
                const relativeElapsed = (elapsed + durationPerIndex * i) % this.spinnerOptions.rotationDuration;
                const currentRotation = relativeElapsed / this.spinnerOptions.rotationDuration;
                const value = hsvColor.v * Math.max(0, 1 - (currentRotation / tailRotationPart));
                this.colors[i] = NeoPixelController.hsvToHex(hsvColor.h, hsvColor.s, value);
            }
            ws281x.render();

            if (this.switchingState) {
                const currentCycleElapsed = elapsed % this.spinnerOptions.rotationDuration;
                const switchTime = Date.now();
                const targetColorHsv = NeoPixelController.hexToHsv(this.targetColor);

                let hueDifference = targetColorHsv.h - hsvColor.h;
                if (hueDifference > 180) {
                    hueDifference = hueDifference - 360;
                } else if (hueDifference < -180) {
                    hueDifference = 360 + hueDifference;
                }
                const saturationDifference = targetColorHsv.s - hsvColor.s;
                const valueDifference = targetColorHsv.v - hsvColor.v;

                while (Date.now() - switchTime < this.spinnerOptions.rotationDuration) {
                    const realElapsed = Date.now() - switchTime;
                    const elapsedSwitch = realElapsed + currentCycleElapsed;
                    for (let i = 0; i < this.channel.count; i++) {
                        const relativeElapsed = (elapsedSwitch + durationPerIndex * i) % this.spinnerOptions.rotationDuration;
                        const currentRotation = relativeElapsed / this.spinnerOptions.rotationDuration;

                        const hue = mod(hsvColor.h + hueDifference * (realElapsed / this.spinnerOptions.rotationDuration), 360);
                        const saturation = hsvColor.s + saturationDifference * (realElapsed / this.spinnerOptions.rotationDuration);
                        let value = hsvColor.v + valueDifference * (realElapsed / this.spinnerOptions.rotationDuration);

                        if (this.currentState == LedState.LOADING || relativeElapsed > realElapsed) {
                            value = value * Math.max(0, 1 - (currentRotation / tailRotationPart));
                        }
                        // if (i == 0) {
                        //     this.logger.debug(`Hue: ${hue}, Saturation: ${saturation}, Value: ${value}`);
                        // }
                        this.colors[i] = NeoPixelController.hsvToHex(hue, saturation, value);
                    }
                    ws281x.render();
                }
                if (this.currentState != LedState.LOADING) {
                    clearInterval(spinnerInterval);
                    this.busy = false;
                } else {
                    this.switchingState = false;
                    hsvColor = NeoPixelController.hexToHsv(this.targetColor);
                }
            }
        });

    }

    private renderBlinking(options: LedStateOptions) {
        this.busy = true;
        const blinkDuration = options.blinkDuration || 500;
        const blinkCount = options.blinkCount || 2;
        const colorHsv = NeoPixelController.hexToHsv(options.color);

        const startTime = Date.now();

        const interval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / blinkDuration;

            if (progress >= 1) {
                for (let i = 0; i < this.channel.count; i++) {
                    this.colors[i] = 0x000000;
                }
                ws281x.render();

                this.currentState = LedState.OFF;
                this.switchingState = false;
                this.busy = false;
                clearInterval(interval);
            } else {
                const currentValue = Math.sin(2 * Math.PI * (progress - 0.25) * blinkCount)
                const currentColor = NeoPixelController.hsvToHex(colorHsv.h, colorHsv.s, colorHsv.v * currentValue);
                for (let i = 0; i < this.channel.count; i++) {
                    this.colors[i] = currentColor;
                }
                ws281x.render();
            }
        });
    }

    fadeToColor(options: LedStateOptions, duration: number) {
        this.busy = true;
        const startTime = Date.now();
        const startColor = NeoPixelController.hexToRgb(this.colors[0]);
        const targetColor = NeoPixelController.hexToRgb(options.color);
        const difference = {
            r: targetColor.r - startColor.r,
            g: targetColor.g - startColor.g,
            b: targetColor.b - startColor.b
        }
        const interval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / duration;

            if (progress >= 1) {
                for (let i = 0; i < this.channel.count; i++) {
                    this.colors[i] = options.color;
                }
                ws281x.render();

                this.busy = false;
                clearInterval(interval);
            } else {
                for (let i = 0; i < this.channel.count; i++) {
                    const currentColor = {
                        r: startColor.r + difference.r * Math.min(1, progress),
                        g: startColor.g + difference.g * Math.min(1, progress),
                        b: startColor.b + difference.b * Math.min(1, progress)
                    }
                    this.colors[i] = NeoPixelController.rgbToHex(currentColor.r, currentColor.g, currentColor.b);
                }
                ws281x.render();
            }
        });
    }

    static rgbToHex(r: number, g: number, b: number): number {
        return (b << 16) + (g << 8) + r;
    }

    static hexToRgb(hex: number): { r: number; g: number; b: number } {
        const r = hex & 255;
        const g = (hex >> 8) & 255;
        const b = (hex >> 16) & 255;
        return { r, g, b };
    }

    static hsvToHex(h: number, s: number, v: number): number {
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

    static hexToHsv(hex: number): { h: number; s: number; v: number } {
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

    waitUntilNotBusy() {
        return new Promise<void>((resolve) => {
            const interval = setInterval(() => {
                if (!this.busy) {
                    clearInterval(interval);
                    resolve();
                }
            }, 100);
        });
    }

    waitForStateSwitch() {
        return new Promise<void>((resolve) => {
            const interval = setInterval(() => {
                if (!this.switchingState) {
                    clearInterval(interval);
                    resolve();
                }
            }, 100);
        });
    }
}