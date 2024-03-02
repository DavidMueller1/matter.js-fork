/**
 * @license
 * Copyright 2022-2024 Project CHIP Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Behavior } from "../../Behavior.js";
import type { NetworkRuntime } from "./NetworkRuntime.js";

/**
 * NetworkingBehavior is the component of Matter.js that handles online connectivity for a Matter Node.
 *
 * NetworkingBehavior does not have an associated Matter cluster.  It is exclusive to Matter.js.
 */
export class NetworkBehavior extends Behavior {
    static override readonly id = "network";

    static override readonly early = true;

    declare internal: NetworkBehavior.Internal;
    declare state: NetworkBehavior.State;

    [Symbol.asyncDispose]() {
        return this.internal.runtime?.close();
    }
}

export namespace NetworkBehavior {
    export class Internal {
        runtime?: NetworkRuntime;
    }

    export class State {
        port = 5540;
        operationalPort = -1;
    }
}
