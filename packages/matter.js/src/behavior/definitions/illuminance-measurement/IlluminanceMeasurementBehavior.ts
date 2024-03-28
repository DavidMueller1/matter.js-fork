/**
 * @license
 * Copyright 2022-2024 Matter.js Authors
 * SPDX-License-Identifier: Apache-2.0
 */

/*** THIS FILE IS GENERATED, DO NOT EDIT ***/

import { IlluminanceMeasurement } from "../../../cluster/definitions/IlluminanceMeasurementCluster.js";
import { ClusterBehavior } from "../../cluster/ClusterBehavior.js";

/**
 * IlluminanceMeasurementBehavior is the base class for objects that support interaction with {@link
 * IlluminanceMeasurement.Cluster}.
 */
export const IlluminanceMeasurementBehavior = ClusterBehavior.for(IlluminanceMeasurement.Cluster);

type IlluminanceMeasurementBehaviorType = InstanceType<typeof IlluminanceMeasurementBehavior>;
export interface IlluminanceMeasurementBehavior extends IlluminanceMeasurementBehaviorType {}
type StateType = InstanceType<typeof IlluminanceMeasurementBehavior.State>;
export namespace IlluminanceMeasurementBehavior { export interface State extends StateType {} }
