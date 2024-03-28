/**
 * @license
 * Copyright 2022-2024 Matter.js Authors
 * SPDX-License-Identifier: Apache-2.0
 */

/*** THIS FILE IS GENERATED, DO NOT EDIT ***/

import { PumpConfigurationAndControl } from "../../../cluster/definitions/PumpConfigurationAndControlCluster.js";
import { ClusterBehavior } from "../../cluster/ClusterBehavior.js";
import { ClusterType } from "../../../cluster/ClusterType.js";

/**
 * PumpConfigurationAndControlBehavior is the base class for objects that support interaction with {@link
 * PumpConfigurationAndControl.Cluster}.
 *
 * PumpConfigurationAndControl.Cluster requires you to enable one or more optional features. You can do so using {@link
 * PumpConfigurationAndControlBehavior.with}.
 */
export const PumpConfigurationAndControlBehavior = ClusterBehavior.for(ClusterType(PumpConfigurationAndControl.Base));

type PumpConfigurationAndControlBehaviorType = InstanceType<typeof PumpConfigurationAndControlBehavior>;
export interface PumpConfigurationAndControlBehavior extends PumpConfigurationAndControlBehaviorType {}
type StateType = InstanceType<typeof PumpConfigurationAndControlBehavior.State>;
export namespace PumpConfigurationAndControlBehavior { export interface State extends StateType {} }
