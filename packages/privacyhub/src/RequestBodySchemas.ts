import { LedState } from "./NeoPixelController.js";

export const ledStateSchema = {
    ledState: {
        type: 'string',
        enum: Object.values(LedState),
    },
}