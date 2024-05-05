/**
 * @license
 * Copyright 2022-2024 Matter.js Authors
 * SPDX-License-Identifier: Apache-2.0
 */
import { MatterError } from "../common/MatterError.js";
import { MaybePromise } from "../util/Promises.js";
import { SupportedStorageTypes } from "./StringifyTools.js";

export class StorageError extends MatterError {}

/**
 * Matter.js uses this key/value API to manage persistent state.
 */
export interface Storage {
    initialize(): MaybePromise<void>;
    close(): MaybePromise<void>;
    get(contexts: string[], key: string): MaybePromise<SupportedStorageTypes | undefined>;
    set(contexts: string[], values: Record<string, SupportedStorageTypes>): MaybePromise<void>;
    set(contexts: string[], key: string, value: SupportedStorageTypes): MaybePromise<void>;
    delete(contexts: string[], key: string): MaybePromise<void>;
    keys(contexts: string[]): MaybePromise<string[]>;
    values(contexts: string[]): MaybePromise<Record<string, SupportedStorageTypes>>;
    contexts(contexts: string[]): MaybePromise<string[]>;
    clearAll(contexts: string[]): MaybePromise<void>;
}

// This extra class is needed because of https://github.com/microsoft/TypeScript/issues/57905 in order
// to have the generics typing support on the "get" method and can be removed when the TS issue is fixed
// or we remove the legacy API.
export abstract class MaybeAsyncStorage implements Storage {
    abstract initialize(): MaybePromise<void>;
    abstract close(): MaybePromise<void>;
    abstract get<T extends SupportedStorageTypes>(contexts: string[], key: string): MaybePromise<T | undefined>;
    abstract set(contexts: string[], values: Record<string, SupportedStorageTypes>): MaybePromise<void>;
    abstract set(contexts: string[], key: string, value: SupportedStorageTypes): MaybePromise<void>;
    abstract delete(contexts: string[], key: string): MaybePromise<void>;
    abstract keys(contexts: string[]): MaybePromise<string[]>;
    abstract values(contexts: string[]): MaybePromise<Record<string, SupportedStorageTypes>>;
    abstract contexts(contexts: string[]): MaybePromise<string[]>;
    abstract clearAll(contexts: string[]): MaybePromise<void>;
}

// This can be removed once we remove the legacy API
export abstract class SyncStorage implements Storage {
    abstract initialize(): MaybePromise<void>;
    abstract close(): MaybePromise<void>;
    abstract get<T extends SupportedStorageTypes>(contexts: string[], key: string): T | undefined;
    abstract set(contexts: string[], values: Record<string, SupportedStorageTypes>): void;
    abstract set(contexts: string[], key: string, value: SupportedStorageTypes): void;
    abstract delete(contexts: string[], key: string): void;
    abstract keys(contexts: string[]): string[];
    abstract values(contexts: string[]): Record<string, SupportedStorageTypes>;
    abstract contexts(contexts: string[]): string[];
    abstract clearAll(contexts: string[]): void;
}

export type StorageOperationResult<S extends Storage, T = void> = S extends SyncStorage ? T : Promise<T>;
