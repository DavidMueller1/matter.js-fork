/**
 * @license
 * Copyright 2022-2024 Matter.js Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ByteArray } from "../../../util/ByteArray.js";
import { isObject } from "../../../util/Type.js";
import { DatatypeError, SchemaErrorPath } from "../../errors.js";
import { Val } from "../Val.js";

export function assertNumber(value: Val, path: SchemaErrorPath): asserts value is number {
    if (typeof value === "number") {
        return;
    }
    throw new DatatypeError(path, "a number", value);
}

export function assertBoolean(value: Val, path: SchemaErrorPath): asserts value is number {
    if (typeof value === "boolean" || value === 0 || value === 1) {
        return;
    }
    throw new DatatypeError(path, "a boolean", value);
}

export function assertObject(value: Val, path: SchemaErrorPath): asserts value is Val.Struct {
    if (isObject(value)) {
        return;
    }
    throw new DatatypeError(path, "an object", value);
}

export function assertNumeric(value: Val, path: SchemaErrorPath): asserts value is number | bigint {
    if (typeof value === "number" || typeof value === "bigint") {
        return;
    }
    throw new DatatypeError(path, "a number or bigint", value);
}

export function assertString(value: Val, path: SchemaErrorPath): asserts value is string {
    if (typeof value === "string") {
        return;
    }
    throw new DatatypeError(path, "a string", value);
}

export function assertBytes(value: Val, path: SchemaErrorPath): asserts value is ByteArray {
    if (value instanceof ByteArray) {
        return;
    }
    throw new DatatypeError(path, "a byte array", value);
}

export function assertSequence(value: Val, path: SchemaErrorPath): asserts value is string | ByteArray {
    if (typeof value === "string" || value instanceof ByteArray) {
        return;
    }
    throw new DatatypeError(path, "a string or byte array", value);
}

export function assertArray(value: Val, path: SchemaErrorPath): asserts value is Val[] {
    if (!Array.isArray(value)) {
        throw new DatatypeError(path, "an array", value);
    }
}
