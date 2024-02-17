/**
 * @license
 * Copyright 2022-2023 Project CHIP Authors
 * SPDX-License-Identifier: Apache-2.0
 */

/*** THIS FILE IS GENERATED, DO NOT EDIT ***/

import { MaybePromise } from "../../../util/Promises.js";
import { TypeFromSchema } from "../../../tlv/TlvSchema.js";
import { AudioOutput } from "../../../cluster/definitions/AudioOutputCluster.js";
import { MatterApplicationClusterSpecificationV1_1 } from "../../../spec/Specifications.js";

/**
 * @see {@link MatterApplicationClusterSpecificationV1_1} § 6.5.4
 */
export type SelectOutputRequest = TypeFromSchema<typeof AudioOutput.TlvSelectOutputRequest>;

/**
 * Upon receipt, this shall rename the output at a specific index in the Output List.
 *
 * Updates to the output name shall appear in the device’s settings menus. Name updates may automatically be sent to
 * the actual device to which the output connects.
 *
 * @see {@link MatterApplicationClusterSpecificationV1_1} § 6.5.4.2
 */
export type RenameOutputRequest = TypeFromSchema<typeof AudioOutput.TlvRenameOutputRequest>;

export namespace AudioOutputInterface {
    export interface Base {
        /**
         * @see {@link MatterApplicationClusterSpecificationV1_1} § 6.5.4
         */
        selectOutput(request: SelectOutputRequest): MaybePromise;
    }

    export interface NameUpdates {
        /**
         * Upon receipt, this shall rename the output at a specific index in the Output List.
         *
         * Updates to the output name shall appear in the device’s settings menus. Name updates may automatically be
         * sent to the actual device to which the output connects.
         *
         * @see {@link MatterApplicationClusterSpecificationV1_1} § 6.5.4.2
         */
        renameOutput(request: RenameOutputRequest): MaybePromise;
    }
}

export type AudioOutputInterface = {
    components: [
        { flags: {}, methods: AudioOutputInterface.Base },
        { flags: { nameUpdates: true }, methods: AudioOutputInterface.NameUpdates }
    ]
};
