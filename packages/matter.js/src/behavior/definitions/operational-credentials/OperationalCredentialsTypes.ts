/**
 * @license
 * Copyright 2022-2024 Project CHIP Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { TlvUInt32 } from "../../../tlv/TlvNumber.js";
import { TlvField, TlvObject, TlvOptionalField } from "../../../tlv/TlvObject.js";
import { TlvByteString } from "../../../tlv/TlvString.js";

/** @see {@link MatterCoreSpecificationV1_1} § 11.17.5.4 */
export const TlvAttestation = TlvObject({
    declaration: TlvField(1, TlvByteString),
    attestationNonce: TlvField(2, TlvByteString.bound({ length: 32 })),
    timestamp: TlvField(3, TlvUInt32), // TODO: check actual max length in specs
    firmwareInfo: TlvOptionalField(4, TlvByteString),
});

/** @see {@link MatterCoreSpecificationV1_1} § 11.17.5.6 */
export const TlvCertSigningRequest = TlvObject({
    certSigningRequest: TlvField(1, TlvByteString),
    csrNonce: TlvField(2, TlvByteString.bound({ length: 32 })),
    vendorReserved1: TlvOptionalField(3, TlvByteString),
    vendorReserved2: TlvOptionalField(4, TlvByteString),
    vendorReserved3: TlvOptionalField(5, TlvByteString),
});
