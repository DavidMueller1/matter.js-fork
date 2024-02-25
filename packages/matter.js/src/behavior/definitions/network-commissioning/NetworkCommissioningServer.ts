/**
 * @license
 * Copyright 2022-2023 Project CHIP Authors
 * SPDX-License-Identifier: Apache-2.0
 */

/*** THIS FILE WILL BE REGENERATED IF YOU DO NOT REMOVE THIS MESSAGE ***/

import { NetworkCommissioningBehavior } from "./NetworkCommissioningBehavior.js";

/**
 * This is the default server implementation of {@link NetworkCommissioningBehavior}.
 *
 * The Matter specification requires the NetworkCommissioning cluster to support features we do not enable by default.
 * You should use {@link NetworkCommissioningServer.with} to specialize the class for the features your implementation
 * supports.
 */
export class NetworkCommissioningServer extends NetworkCommissioningBehavior {
}