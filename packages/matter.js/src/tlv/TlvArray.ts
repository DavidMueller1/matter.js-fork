/**
 * @license
 * Copyright 2022-2024 Project CHIP Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { UnexpectedDataError } from "../common/MatterError.js";
import { tryCatch } from "../common/TryCatchHandler.js";
import { ValidationError } from "../common/ValidationError.js";
import { MatterCoreSpecificationV1_0 } from "../spec/Specifications.js";
import { TlvTag, TlvType, TlvTypeLength } from "./TlvCodec.js";
import { TlvReader, TlvSchema, TlvStream, TlvWriter } from "./TlvSchema.js";

export type LengthConstraints = {
    minLength?: number;
    maxLength?: number;
    length?: number;
};

type ArrayChunkData = {
    listIndex: number | null | undefined;
    element: TlvStream;
};
export type ArrayAsChunked = ArrayChunkData[];

/**
 * Schema to encode an array or string in TLV.
 *
 * @see {@link MatterCoreSpecificationV1_0} § A.11.2 and A.11.4
 */
export class ArraySchema<T> extends TlvSchema<T[]> {
    constructor(
        readonly elementSchema: TlvSchema<T>,
        private readonly minLength: number = 0,
        private readonly maxLength: number = 65535,
    ) {
        super();
    }

    override encodeTlvInternal(writer: TlvWriter, value: T[], tag?: TlvTag, forWriteInteraction?: boolean): void {
        writer.writeTag({ type: TlvType.Array }, tag);
        value.forEach(element => this.elementSchema.encodeTlvInternal(writer, element, undefined, forWriteInteraction));
        writer.writeTag({ type: TlvType.EndOfContainer });
    }

    override decodeTlvInternalValue(reader: TlvReader, typeLength: TlvTypeLength): T[] {
        if (typeLength.type !== TlvType.Array)
            throw new UnexpectedDataError(`Unexpected type ${typeLength.type}, expected Array (${TlvType.Array}).`);
        const result = new Array<T>();
        while (true) {
            const { tag: elementTag, typeLength: elementTypeLength } = reader.readTagType();
            if (elementTag !== undefined) throw new UnexpectedDataError("Array element tags should be anonymous.");
            if (elementTypeLength.type === TlvType.EndOfContainer) break;
            result.push(this.elementSchema.decodeTlvInternalValue(reader, elementTypeLength));
        }
        return result;
    }

    override injectField(
        value: T[],
        fieldId: number,
        fieldValue: any,
        injectChecker: (fieldValue: any) => boolean,
    ): T[] {
        if (Array.isArray(value)) {
            value.forEach(
                (item, index) =>
                    (value[index] = this.elementSchema.injectField(item, fieldId, fieldValue, injectChecker)),
            );
        }
        return value;
    }

    override removeField(value: T[], fieldId: number, removeChecker: (fieldValue: any) => boolean): T[] {
        if (Array.isArray(value)) {
            value.forEach(
                (item, index) => (value[index] = this.elementSchema.removeField(item, fieldId, removeChecker)),
            );
        }
        return value;
    }

    override validate(data: T[]): void {
        if (!Array.isArray(data)) throw new ValidationError(`Expected array, got ${typeof data}.`);
        if (data.length > this.maxLength)
            throw new ValidationError(`Array is too long: ${data.length}, max ${this.maxLength}.`);
        if (data.length < this.minLength)
            throw new ValidationError(`Array is too short: ${data.length}, min ${this.minLength}.`);
        data.forEach((element, index) => {
            tryCatch(
                () => this.elementSchema.validate(element),
                ValidationError,
                error => {
                    error.fieldName = `[${index}]${error.fieldName !== undefined ? `.${error.fieldName}` : ""}`;
                    throw error;
                },
            );
        });
    }

    decodeFromChunkedArray(chunks: ArrayAsChunked, currentValue?: T[]): T[] {
        if (currentValue === undefined && chunks[0].listIndex !== undefined) {
            throw new UnexpectedDataError(
                `When no current value is supplied the first chunked element needs to have a list index of undefined, but received ${chunks[0].listIndex}.`,
            );
        }
        currentValue = currentValue ?? []; // For the sake of typing; the above check makes sure it is an array
        for (const { listIndex, element } of chunks) {
            if (listIndex === undefined) {
                // not set listIndex means "Override the whole array"
                currentValue = this.decodeTlv(element);
            } else if (listIndex === null) {
                // null listIndex means "Append to the array"
                const decodedElement = this.elementSchema.decodeTlv(element);
                currentValue.push(decodedElement);
            } else if (element[0].typeLength.type === TlvType.Null) {
                // null element means "Remove from the array"
                currentValue.splice(listIndex, 1);
            } else {
                // otherwise, set the element at the given index
                currentValue[listIndex] = this.elementSchema.decodeTlv(element);
            }
        }
        return currentValue;
    }

    encodeAsChunkedArray(value: T[]): ArrayAsChunked {
        const result: ArrayAsChunked = [];
        result.push({ listIndex: undefined, element: this.encodeTlv([]) });
        value.forEach(element => {
            const elementStream = this.elementSchema.encodeTlv(element);
            result.push({ listIndex: null, element: elementStream });
        });
        return result;
    }
}

/** Array TLV schema. */
export const TlvArray = <T>(elementSchema: TlvSchema<T>, { minLength, maxLength, length }: LengthConstraints = {}) =>
    new ArraySchema(elementSchema, length ?? minLength, length ?? maxLength);
