/**
 * @license
 * Copyright 2022-2024 Matter.js Authors
 * SPDX-License-Identifier: Apache-2.0
 */

/*** THIS FILE IS GENERATED, DO NOT EDIT ***/

import {
    OtaSoftwareUpdateRequestorServer as BaseOtaSoftwareUpdateRequestorServer
} from "../../../behavior/definitions/ota-software-update-requestor/OtaSoftwareUpdateRequestorServer.js";
import {
    OtaSoftwareUpdateProviderBehavior as BaseOtaSoftwareUpdateProviderBehavior
} from "../../../behavior/definitions/ota-software-update-provider/OtaSoftwareUpdateProviderBehavior.js";
import { MutableEndpoint } from "../../type/MutableEndpoint.js";
import { DeviceClasses } from "../../../device/DeviceTypes.js";
import { SupportedBehaviors } from "../../properties/SupportedBehaviors.js";
import { Identity } from "../../../util/Type.js";
import { MatterDeviceLibrarySpecificationV1_1 } from "../../../spec/Specifications.js";

export namespace OtaRequestorRequirements {
    /**
     * The {@link OtaSoftwareUpdateRequestor} cluster is required by the Matter specification
     *
     * We provide this alias for convenience.
     */
    export const OtaSoftwareUpdateRequestorServer = BaseOtaSoftwareUpdateRequestorServer;

    /**
     * The {@link OtaSoftwareUpdateProvider} cluster is required by the Matter specification
     *
     * We provide this alias for convenience.
     */
    export const OtaSoftwareUpdateProviderBehavior = BaseOtaSoftwareUpdateProviderBehavior;

    /**
     * An implementation for each server cluster supported by the endpoint per the Matter specification.
     */
    export const server = { mandatory: { OtaSoftwareUpdateRequestor: OtaSoftwareUpdateRequestorServer } };

    /**
     * A definition for each client cluster supported by the endpoint per the Matter specification.
     */
    export const client = { mandatory: { OtaSoftwareUpdateProvider: OtaSoftwareUpdateProviderBehavior } };
}

export const OtaRequestorEndpointDefinition = MutableEndpoint({
    name: "OtaRequestor",
    deviceType: 0x12,
    deviceRevision: 1,
    deviceClass: DeviceClasses.Utility,
    requirements: OtaRequestorRequirements,
    behaviors: SupportedBehaviors(OtaRequestorRequirements.server.mandatory.OtaSoftwareUpdateRequestor)
});

/**
 * An OTA Requestor is a device that is capable of receiving an OTA software update.
 *
 * @see {@link MatterDeviceLibrarySpecificationV1_1} § 2.3
 */
export interface OtaRequestorEndpoint extends Identity<typeof OtaRequestorEndpointDefinition> {}

export const OtaRequestorEndpoint: OtaRequestorEndpoint = OtaRequestorEndpointDefinition;
