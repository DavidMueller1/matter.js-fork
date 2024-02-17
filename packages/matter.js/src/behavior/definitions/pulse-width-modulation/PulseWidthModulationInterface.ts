/**
 * @license
 * Copyright 2022-2023 Project CHIP Authors
 * SPDX-License-Identifier: Apache-2.0
 */

/*** THIS FILE IS GENERATED, DO NOT EDIT ***/

import { MaybePromise } from "../../../util/Promises.js";
import { TypeFromSchema } from "../../../tlv/TlvSchema.js";
import { PulseWidthModulation } from "../../../cluster/definitions/PulseWidthModulationCluster.js";
import { MatterApplicationClusterSpecificationV1_1 } from "../../../spec/Specifications.js";

/**
 * @see {@link MatterApplicationClusterSpecificationV1_1} § 1.6.6.1
 */
export type MoveToLevelRequest = TypeFromSchema<typeof PulseWidthModulation.TlvMoveToLevelRequest>;

/**
 * @see {@link MatterApplicationClusterSpecificationV1_1} § 1.6.6.2
 */
export type MoveRequest = TypeFromSchema<typeof PulseWidthModulation.TlvMoveRequest>;

/**
 * The StepMode field shall be one of the non-reserved values in Values of the StepMode Field.
 *
 * The TransitionTime field specifies the time that shall be taken to perform the step, in tenths of a second. A step
 * is a change in the CurrentLevel of StepSize units. The actual time taken SHOULD be as close to this as the device is
 * able. If the TransitionTime field is equal to null, the device SHOULD move as fast as it is able.
 *
 * If the device is not able to move at a variable rate, the TransitionTime field may be disregarded.
 *
 * @see {@link MatterApplicationClusterSpecificationV1_1} § 1.6.6.3
 */
export type StepRequest = TypeFromSchema<typeof PulseWidthModulation.TlvStepRequest>;

/**
 * @see {@link MatterApplicationClusterSpecificationV1_1} § 1.6.6.4
 */
export type StopRequest = TypeFromSchema<typeof PulseWidthModulation.TlvStopRequest>;

/**
 * @see {@link MatterApplicationClusterSpecificationV1_1} § 1.6.6.5
 */
export type MoveToClosestFrequencyRequest = TypeFromSchema<typeof PulseWidthModulation.TlvMoveToClosestFrequencyRequest>;

export namespace PulseWidthModulationInterface {
    export interface Base {
        /**
         * @see {@link MatterApplicationClusterSpecificationV1_1} § 1.6.6.1
         */
        moveToLevel(request: MoveToLevelRequest): MaybePromise;

        /**
         * @see {@link MatterApplicationClusterSpecificationV1_1} § 1.6.6.2
         */
        move(request: MoveRequest): MaybePromise;

        /**
         * The StepMode field shall be one of the non-reserved values in Values of the StepMode Field.
         *
         * The TransitionTime field specifies the time that shall be taken to perform the step, in tenths of a second.
         * A step is a change in the CurrentLevel of StepSize units. The actual time taken SHOULD be as close to this
         * as the device is able. If the TransitionTime field is equal to null, the device SHOULD move as fast as it is
         * able.
         *
         * If the device is not able to move at a variable rate, the TransitionTime field may be disregarded.
         *
         * @see {@link MatterApplicationClusterSpecificationV1_1} § 1.6.6.3
         */
        step(request: StepRequest): MaybePromise;

        /**
         * @see {@link MatterApplicationClusterSpecificationV1_1} § 1.6.6.4
         */
        stop(request: StopRequest): MaybePromise;

        /**
         * @see {@link MatterApplicationClusterSpecificationV1_1} § 1.6.6
         */
        moveToLevelWithOnOff(): MaybePromise;

        /**
         * @see {@link MatterApplicationClusterSpecificationV1_1} § 1.6.6
         */
        moveWithOnOff(): MaybePromise;

        /**
         * @see {@link MatterApplicationClusterSpecificationV1_1} § 1.6.6
         */
        stepWithOnOff(): MaybePromise;

        /**
         * @see {@link MatterApplicationClusterSpecificationV1_1} § 1.6.6
         */
        stopWithOnOff(): MaybePromise;
    }

    export interface Frequency {
        /**
         * @see {@link MatterApplicationClusterSpecificationV1_1} § 1.6.6.5
         */
        moveToClosestFrequency(request: MoveToClosestFrequencyRequest): MaybePromise;
    }
}

export type PulseWidthModulationInterface = {
    components: [
        { flags: {}, methods: PulseWidthModulationInterface.Base },
        { flags: { frequency: true }, methods: PulseWidthModulationInterface.Frequency }
    ]
};
