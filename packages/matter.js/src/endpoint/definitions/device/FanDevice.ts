/**
 * @license
 * Copyright 2022-2024 Matter.js Authors
 * SPDX-License-Identifier: Apache-2.0
 */

/*** THIS FILE IS GENERATED, DO NOT EDIT ***/

import { IdentifyServer as BaseIdentifyServer } from "../../../behavior/definitions/identify/IdentifyServer.js";
import { GroupsServer as BaseGroupsServer } from "../../../behavior/definitions/groups/GroupsServer.js";
import { FanControlServer as BaseFanControlServer } from "../../../behavior/definitions/fan-control/FanControlServer.js";
import { MutableEndpoint } from "../../type/MutableEndpoint.js";
import { SupportedBehaviors } from "../../properties/SupportedBehaviors.js";
import { Identity } from "../../../util/Type.js";
import { MatterDeviceLibrarySpecificationV1_1 } from "../../../spec/Specifications.js";

export namespace FanRequirements {
    /**
     * The {@link Identify} cluster is required by the Matter specification
     *
     * We provide this alias for convenience.
     */
    export const IdentifyServer = BaseIdentifyServer;

    /**
     * The {@link Groups} cluster is required by the Matter specification
     *
     * We provide this alias for convenience.
     */
    export const GroupsServer = BaseGroupsServer;

    /**
     * The {@link FanControl} cluster is required by the Matter specification
     *
     * We provide this alias for convenience.
     */
    export const FanControlServer = BaseFanControlServer;

    /**
     * An implementation for each server cluster supported by the endpoint per the Matter specification.
     */
    export const server = { mandatory: { Identify: IdentifyServer, Groups: GroupsServer, FanControl: FanControlServer } };
}

export const FanDeviceDefinition = MutableEndpoint({
    name: "Fan",
    deviceType: 0x2b,
    deviceRevision: 1,
    requirements: FanRequirements,
    behaviors: SupportedBehaviors(
        FanRequirements.server.mandatory.Identify,
        FanRequirements.server.mandatory.Groups,
        FanRequirements.server.mandatory.FanControl
    )
});

/**
 * This defines conformance to the Fan device type.
 *
 * NOTE Support for Fan device type is provisional.
 *
 * @see {@link MatterDeviceLibrarySpecificationV1_1} § 9.3
 */
export interface FanDevice extends Identity<typeof FanDeviceDefinition> {}

export const FanDevice: FanDevice = FanDeviceDefinition;
