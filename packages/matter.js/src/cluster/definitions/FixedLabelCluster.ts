/**
 * @license
 * Copyright 2022-2024 Matter.js Authors
 * SPDX-License-Identifier: Apache-2.0
 */

/*** THIS FILE IS GENERATED, DO NOT EDIT ***/

import { MutableCluster } from "../../cluster/mutation/MutableCluster.js";
import { Attribute } from "../../cluster/Cluster.js";
import { TlvArray } from "../../tlv/TlvArray.js";
import { Label } from "../../cluster/definitions/LabelCluster.js";
import { Identity } from "../../util/Type.js";
import { ClusterRegistry } from "../../cluster/ClusterRegistry.js";

export namespace FixedLabel {
    /**
     * @see {@link Cluster}
     */
    export const ClusterInstance = MutableCluster({
        id: 0x40,
        name: "FixedLabel",
        revision: 1,

        attributes: {
            /**
             * @see {@link MatterSpecification.v11.Core} § 9.8.4
             */
            labelList: Attribute(0x0, TlvArray(Label.TlvLabelStruct), { persistent: true, default: [] })
        }
    })

    /**
     * Fixed Label
     *
     * This cluster provides a feature for the device to tag an endpoint with zero or more read only labels. Examples:
     *
     *   • A bridge can use this to indicate grouping of bridged devices. For example: All bridged devices whose
     *     endpoints have an entry in their LabelList "room":"bedroom 2" are in the same (bed)room.
     *
     *   • A manufacturer can use this to identify a characteristic of an endpoint. For example to identify the
     *     endpoints of a luminaire, one pointing up, the other pointing down, one of the endpoints would have a
     *     LabelList entry "orientation":"up" while the other would have "orientation":"down". Using such indication,
     *     the user interface of a Node controlling this luminaire knows which of the endpoints is which of the lights.
     *
     * @see {@link MatterSpecification.v11.Core} § 9.8
     */
    export interface Cluster extends Identity<typeof ClusterInstance> {}

    export const Cluster: Cluster = ClusterInstance;

    export const Complete = Cluster;
}

export type FixedLabelCluster = FixedLabel.Cluster;
export const FixedLabelCluster = FixedLabel.Cluster;
ClusterRegistry.register(FixedLabel.Complete);
