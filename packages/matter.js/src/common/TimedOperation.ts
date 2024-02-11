/**
 * @license
 * Copyright 2022-2023 Project CHIP Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { MatterDevice } from "../MatterDevice.js";
import { NodeId } from "../datatype/NodeId.js";
import { VendorId } from "../datatype/VendorId.js";
import { Fabric, FabricBuilder } from "../fabric/Fabric.js";
import { FabricManager } from "../fabric/FabricManager.js";
import { Logger } from "../log/Logger.js";
import { SecureSession } from "../session/SecureSession.js";
import { SessionManager } from "../session/SessionManager.js";
import { AsyncConstruction } from "../util/AsyncConstruction.js";
import { ByteArray } from "../util/ByteArray.js";
import { Observable } from "../util/Observable.js";
import { FailsafeManager, MatterFabricConflictError } from "./FailsafeManager.js";
import { MatterFlowError } from "./MatterError.js";

const logger = Logger.get("TimedOperation");

/**
 * A "timed operation" is a command or sequence of commands that operate with a failsafe timer that will abort the
 * operation if it does not complete within a specific window.
 *
 * TimedOperation maintains the failsafe timer and tracks information required to rollback state if the operation
 * aborts.
 *
 * Timed operations are exclusive for a node.
 */
export abstract class TimedOperation {
    #sessions: SessionManager<MatterDevice>;
    #fabrics: FabricManager;
    #failsafe?: FailsafeManager;
    #construction: AsyncConstruction<TimedOperation>;
    #associatedFabric?: Fabric;
    #csrSessionId?: number;
    #forUpdateNoc?: boolean;
    #fabricBuilder = new FabricBuilder();

    #events = {
        fabricAdded: Observable<[fabric: Fabric]>(),
        fabricUpdated: Observable<[fabric: Fabric]>(),
        commissioned: Observable<[], Promise<void>>(),
    };

    constructor(options: TimedOperation.Options) {
        const { expiryLengthSeconds, associatedFabric, maxCumulativeFailsafeSeconds } = options;

        this.#sessions = options.sessions;
        this.#fabrics = options.fabrics;
        this.#associatedFabric = options.associatedFabric;

        this.#construction = AsyncConstruction(this, async () => {
            // Ensure derived class construction is complete
            await Promise.resolve();

            await this.storeEndpointState();

            // If ExpiryLengthSeconds is non-zero and the fail-safe timer was not currently armed, then the fail-safe
            // timer SHALL be armed for that duration.
            this.#failsafe = new FailsafeManager(
                associatedFabric,
                expiryLengthSeconds,
                maxCumulativeFailsafeSeconds,
                () => this.#failSafeExpired(),
            );
            logger.debug(`Arm failSafe timer for ${expiryLengthSeconds}s.`);
        });
    }

    async extend(fabric: Fabric | undefined, expiryLengthSeconds: number) {
        await this.#construction;
        await this.#failsafe?.reArm(fabric, expiryLengthSeconds);
        if (expiryLengthSeconds > 0) {
            logger.debug(`Extend failSafe timer for ${expiryLengthSeconds}s.`);
        }
    }

    get fabricIndex() {
        return this.#fabricBuilder.getFabricIndex();
    }

    get construction() {
        return this.#construction;
    }

    get events() {
        return this.#events;
    }

    get associatedFabric() {
        return this.#associatedFabric;
    }

    get csrSessionId() {
        return this.#csrSessionId;
    }

    get forUpdateNoc() {
        return this.#forUpdateNoc;
    }

    get hasRootCert() {
        return this.#fabricBuilder.hasRootCert();
    }

    async completeCommission() {
        // 1. The Fail-Safe timer associated with the current Fail-Safe context SHALL be disarmed.
        if (this.#failsafe === undefined) {
            throw new MatterFlowError("armFailSafe should be called first!"); // TODO
        }
        this.#failsafe.complete();

        if (this.fabricIndex !== undefined) {
            this.#fabrics.persistFabrics();
        }

        this.#failsafe = undefined;

        // 2. The commissioning window at the Server SHALL be closed.
        await this.events.commissioned.emit();

        // TODO 3. Any temporary administrative privileges automatically granted to any open PASE session SHALL be revoked (see Section 6.6.2.8, “Bootstrapping of the Access Control Cluster”).

        // 4. The Secure Session Context of any PASE session still established at the Server SHALL be cleared.
        await this.removePaseSession();

        await this.destroy();
    }

    getFailSafeContext() {
        if (this.#failsafe === undefined) throw new MatterFlowError("armFailSafe should be called first!");
        return this.#failsafe;
    }

    getNextFabricIndex() {
        return this.#fabrics.getNextFabricIndex();
    }

    async addFabric(fabric: Fabric) {
        this.#fabrics.addFabric(fabric);
        if (this.#failsafe !== undefined) {
            this.#associatedFabric = this.#failsafe.associatedFabric = fabric;
        }
        this.#events.fabricAdded.emit(fabric);
        return fabric.fabricIndex;
    }

    updateFabric(fabric: Fabric) {
        this.#fabrics.updateFabric(fabric);
        this.#sessions.updateFabricForResumptionRecords(fabric);
        this.#events.fabricUpdated.emit(fabric);
    }

    /**
     * Handles a CSR from OperationalCredentials cluster and stores additional internal information for further
     * validity checks.
     */
    createCertificateSigningRequest(isForUpdateNoc: boolean, sessionId: number) {
        // TODO handle isForUpdateNoc and UpdateNoc correctly

        // TODO If the Node Operational Key Pair generated during processing of the Node Operational CSR Procedure is
        //  found to collide with an existing key pair already previously generated and installed, and that check had
        //  been executed, then this command SHALL fail with a FAILURE status code sent back to the initiator.

        const result = this.#fabricBuilder.createCertificateSigningRequest();
        this.#csrSessionId = sessionId;
        this.#forUpdateNoc = isForUpdateNoc;
        return result;
    }

    async removePaseSession() {
        const session = this.#sessions.getPaseSession();
        if (session) {
            await session.close(true);
        }
    }

    async destroy() {
        await this.#construction;
        await this.#construction.destroy(async () => {
            if (this.#failsafe) {
                this.#failsafe.destroy();
                this.#failsafe = undefined;
                await this.rollback();
            }
        });
    }

    /** Handles adding a trusted root certificate from Operational Credentials cluster. */
    setRootCert(rootCert: ByteArray) {
        // TODO If the certificate from the RootCACertificate field fails any validity checks, not fulfilling all the
        //  requirements for a valid Matter Certificate Encoding representation, including a truncated or oversize
        //  value, then this command SHALL fail with an INVALID_COMMAND status code sent back to the initiator.
        this.#fabricBuilder.setRootCert(rootCert);
    }

    /**
     * Build a new Fabric object based on an existing fabric for the "UpdateNoc" case of the Operational Credentials
     * cluster.
     */
    async buildUpdatedFabric(nocValue: ByteArray, icacValue: ByteArray | undefined) {
        if (this.associatedFabric === undefined) {
            throw new MatterFlowError("No fabric associated with failsafe context, but we prepare an Fabric update.");
        }
        this.#fabricBuilder.initializeFromFabricForUpdate(this.associatedFabric);
        this.#fabricBuilder.setOperationalCert(nocValue);
        if (icacValue && icacValue.length > 0) this.#fabricBuilder.setIntermediateCACert(icacValue);
        return await this.#fabricBuilder.build(this.associatedFabric.fabricIndex);
    }

    /** Build a new Fabric object for a new fabric for the "AddNoc" case of the Operational Credentials cluster. */
    async buildFabric(nocData: {
        nocValue: ByteArray;
        icacValue: ByteArray | undefined;
        adminVendorId: VendorId;
        ipkValue: ByteArray;
        caseAdminSubject: NodeId;
    }) {
        // TODO If the CaseAdminSubject field is not a valid ACL subject in the context of AuthMode set to CASE, such as
        //  not being in either the Operational or CASE Authenticated Tag range, then the device SHALL process the error
        //  by responding with a StatusCode of InvalidAdminSubject as described in Section 11.17.6.7.2, “Handling Errors”.

        const builder = this.#fabricBuilder;

        const { nocValue, icacValue, adminVendorId, ipkValue, caseAdminSubject } = nocData;
        builder.setOperationalCert(nocValue);
        const fabricAlreadyExisting = this.#fabrics.getFabrics().find(fabric => builder.matchesToFabric(fabric));

        if (fabricAlreadyExisting) {
            throw new MatterFabricConflictError(
                `Fabric with Id ${builder.getFabricId()} and Node Id ${builder.getNodeId()} already exists.`,
            );
        }

        if (icacValue && icacValue.length > 0) {
            builder.setIntermediateCACert(icacValue);
        }

        return builder
            .setRootVendorId(adminVendorId)
            .setIdentityProtectionKey(ipkValue)
            .setRootNodeId(caseAdminSubject)
            .build(this.#fabrics.getNextFabricIndex());
    }

    async #failSafeExpired() {
        logger.info("Failsafe timer expired, Reset fabric builder.");

        await this.destroy();
    }

    protected async rollback() {
        if (this.fabricIndex !== undefined && !this.#forUpdateNoc) {
            logger.debug(`Revoking fabric with index ${this.fabricIndex}`);
            await this.#fabrics.revokeFabric(this.fabricIndex);
        }

        // On expiry of the fail-safe timer, the following actions SHALL be performed in order:
        // 1. Terminate any open PASE secure session by clearing any associated Secure Session Context at the Server.
        await this.removePaseSession();

        // TODO 2. Revoke the temporary administrative privileges granted to any open PASE session (see Section 6.6.2.8, “Bootstrapping of the Access Control Cluster”) at the Server.

        // 3. If an AddNOC or UpdateNOC command has been successfully invoked, terminate all CASE sessions associated with the Fabric whose Fabric Index is recorded in the Fail-Safe context (see Section 11.9.6.2, “ArmFailSafe Command”) by clearing any associated Secure Session Context at the Server.
        let fabric: Fabric | undefined = undefined;
        if (this.fabricIndex !== undefined) {
            const fabricIndex = this.fabricIndex;
            fabric = this.#fabrics.getFabrics().find(fabric => fabric.fabricIndex === fabricIndex);
            if (fabric !== undefined) {
                const session = this.#sessions.getSessionForNode(fabric, fabric.rootNodeId);
                if (session !== undefined && session.isSecure()) {
                    await (session as SecureSession<any>).close(false);
                }
            }
        }

        // 4. Reset the configuration of all Network Commissioning Networks attribute to their state prior to the
        //    Fail-Safe being armed.
        await this.restoreNetworkState();

        // 5. If an UpdateNOC command had been successfully invoked, revert the state of operational key pair, NOC and
        //    ICAC for that Fabric to the state prior to the Fail-Safe timer being armed, for the Fabric Index that was
        //    the subject of the UpdateNOC command.
        if (this.associatedFabric !== undefined) {
            if (this.#forUpdateNoc) {
                // update FabricManager and Resumption records but leave current session intact
                this.updateFabric(this.associatedFabric);
            }

            await this.restoreFabric(this.associatedFabric);
        }

        // 6. If an AddNOC command had been successfully invoked, achieve the equivalent effect of invoking the RemoveFabric command against the Fabric Index stored in the Fail-Safe Context for the Fabric Index that was the subject of the AddNOC command. This SHALL remove all associations to that Fabric including all fabric-scoped data, and MAY possibly factory-reset the device depending on current device state. This SHALL only apply to Fabrics added during the fail-safe period as the result of the AddNOC command.
        // 7. Remove any RCACs added by the AddTrustedRootCertificate command that are not currently referenced by any entry in the Fabrics attribute.
        if (fabric !== undefined) {
            const fabricIndex = this.fabricIndex;
            if (fabricIndex !== undefined) {
                const fabric = this.#fabrics.getFabrics().find(fabric => fabric.fabricIndex === fabricIndex);
                if (fabric !== undefined) {
                    await this.revokeFabric(fabric);
                }
            }
        }

        // 8. Reset the Breadcrumb attribute to zero.
        await this.restoreBreadcrumb();

        // TODO 9. Optionally: if no factory-reset resulted from the previous steps, it is RECOMMENDED that the
        //  Node rollback the state of all non fabric-scoped data present in the Fail-Safe context.
    }

    abstract storeEndpointState(): Promise<void>;

    /** Restore Cluster data when the FailSafe context expired. */
    abstract restoreNetworkState(): Promise<void>;

    abstract restoreFabric(fabric: Fabric): Promise<void>;

    abstract revokeFabric(fabric: Fabric): Promise<void>;

    abstract restoreBreadcrumb(): Promise<void>;
}

export namespace TimedOperation {
    export interface Options {
        sessions: SessionManager<MatterDevice>;
        fabrics: FabricManager;
        expiryLengthSeconds: number;
        maxCumulativeFailsafeSeconds: number;
        associatedFabric: Fabric | undefined;
    }
}
