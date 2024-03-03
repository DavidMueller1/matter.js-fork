/**
 * @license
 * Copyright 2022-2024 Matter.js Authors
 * SPDX-License-Identifier: Apache-2.0
 */

/*** THIS FILE IS GENERATED, DO NOT EDIT ***/

import { IdentifyBehavior as BaseIdentifyBehavior } from "../../../behavior/definitions/identify/IdentifyBehavior.js";
import { GroupsBehavior as BaseGroupsBehavior } from "../../../behavior/definitions/groups/GroupsBehavior.js";
import { ScenesBehavior as BaseScenesBehavior } from "../../../behavior/definitions/scenes/ScenesBehavior.js";
import { OnOffBehavior as BaseOnOffBehavior } from "../../../behavior/definitions/on-off/OnOffBehavior.js";
import {
    LevelControlBehavior as BaseLevelControlBehavior
} from "../../../behavior/definitions/level-control/LevelControlBehavior.js";
import {
    ColorControlBehavior as BaseColorControlBehavior
} from "../../../behavior/definitions/color-control/ColorControlBehavior.js";
import {
    IlluminanceMeasurementBehavior as BaseIlluminanceMeasurementBehavior
} from "../../../behavior/definitions/illuminance-measurement/IlluminanceMeasurementBehavior.js";
import {
    OccupancySensingBehavior as BaseOccupancySensingBehavior
} from "../../../behavior/definitions/occupancy-sensing/OccupancySensingBehavior.js";
import { MutableEndpoint } from "../../type/MutableEndpoint.js";
import { SupportedBehaviors } from "../../properties/SupportedBehaviors.js";
import { Identity } from "../../../util/Type.js";
import { MatterDeviceLibrarySpecificationV1_1 } from "../../../spec/Specifications.js";

export namespace ControlBridgeRequirements {
    /**
     * The {@link Identify} cluster is required by the Matter specification
     *
     * We provide this alias for convenience.
     */
    export const IdentifyBehavior = BaseIdentifyBehavior;

    /**
     * The {@link Groups} cluster is required by the Matter specification
     *
     * We provide this alias for convenience.
     */
    export const GroupsBehavior = BaseGroupsBehavior;

    /**
     * The {@link Scenes} cluster is required by the Matter specification
     *
     * We provide this alias for convenience.
     */
    export const ScenesBehavior = BaseScenesBehavior;

    /**
     * The {@link OnOff} cluster is required by the Matter specification
     *
     * We provide this alias for convenience.
     */
    export const OnOffBehavior = BaseOnOffBehavior;

    /**
     * The {@link LevelControl} cluster is required by the Matter specification
     *
     * We provide this alias for convenience.
     */
    export const LevelControlBehavior = BaseLevelControlBehavior;

    /**
     * The {@link ColorControl} cluster is required by the Matter specification
     *
     * We provide this alias for convenience.
     */
    export const ColorControlBehavior = BaseColorControlBehavior;

    /**
     * The {@link IlluminanceMeasurement} cluster is optional per the Matter specification
     *
     * We provide this alias for convenience.
     */
    export const IlluminanceMeasurementBehavior = BaseIlluminanceMeasurementBehavior;

    /**
     * The {@link OccupancySensing} cluster is optional per the Matter specification
     *
     * We provide this alias for convenience.
     */
    export const OccupancySensingBehavior = BaseOccupancySensingBehavior;

    /**
     * A definition for each client cluster supported by the endpoint per the Matter specification.
     */
    export const client = {
        mandatory: {
            Identify: IdentifyBehavior,
            Groups: GroupsBehavior,
            Scenes: ScenesBehavior,
            OnOff: OnOffBehavior,
            LevelControl: LevelControlBehavior,
            ColorControl: ColorControlBehavior
        },

        optional: {
            IlluminanceMeasurement: IlluminanceMeasurementBehavior,
            OccupancySensing: OccupancySensingBehavior
        }
    };
}

export const ControlBridgeDeviceDefinition = MutableEndpoint({
    name: "ControlBridge",
    deviceType: 0x840,
    deviceRevision: 2,
    requirements: ControlBridgeRequirements,
    behaviors: SupportedBehaviors()
});

/**
 * A Control Bridge is a controller device that, when bound to a lighting device such as an Extended Color Light, is
 * capable of being used to switch the device on or off, adjust the intensity of the light being emitted and adjust the
 * color of the light being emitted. In addition, a Control Bridge device is capable of being used for setting scenes.
 *
 * @see {@link MatterDeviceLibrarySpecificationV1_1} § 6.4
 */
export interface ControlBridgeDevice extends Identity<typeof ControlBridgeDeviceDefinition> {}

export const ControlBridgeDevice: ControlBridgeDevice = ControlBridgeDeviceDefinition;
