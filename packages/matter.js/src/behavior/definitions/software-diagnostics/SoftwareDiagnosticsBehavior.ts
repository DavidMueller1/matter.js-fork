/**
 * @license
 * Copyright 2022-2024 Matter.js Authors
 * SPDX-License-Identifier: Apache-2.0
 */

/*** THIS FILE IS GENERATED, DO NOT EDIT ***/

import { SoftwareDiagnostics } from "../../../cluster/definitions/SoftwareDiagnosticsCluster.js";
import { ClusterBehavior } from "../../cluster/ClusterBehavior.js";
import { SoftwareDiagnosticsInterface } from "./SoftwareDiagnosticsInterface.js";

/**
 * SoftwareDiagnosticsBehavior is the base class for objects that support interaction with {@link
 * SoftwareDiagnostics.Cluster}.
 *
 * This class does not have optional features of SoftwareDiagnostics.Cluster enabled. You can enable additional
 * features using SoftwareDiagnosticsBehavior.with.
 */
export const SoftwareDiagnosticsBehavior = ClusterBehavior
    .withInterface<SoftwareDiagnosticsInterface>()
    .for(SoftwareDiagnostics.Cluster);

type SoftwareDiagnosticsBehaviorType = InstanceType<typeof SoftwareDiagnosticsBehavior>;
export interface SoftwareDiagnosticsBehavior extends SoftwareDiagnosticsBehaviorType {}
type StateType = InstanceType<typeof SoftwareDiagnosticsBehavior.State>;
export namespace SoftwareDiagnosticsBehavior { export interface State extends StateType {} }
