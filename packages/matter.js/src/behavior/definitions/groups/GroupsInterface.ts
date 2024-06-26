/**
 * @license
 * Copyright 2022-2024 Matter.js Authors
 * SPDX-License-Identifier: Apache-2.0
 */

/*** THIS FILE IS GENERATED, DO NOT EDIT ***/

import { MaybePromise } from "../../../util/Promises.js";
import { TypeFromSchema } from "../../../tlv/TlvSchema.js";
import { Groups } from "../../../cluster/definitions/GroupsCluster.js";

/**
 * The AddGroup command allows a client to add group membership in a particular group for the server endpoint.
 *
 * @see {@link MatterSpecification.v11.Cluster} § 1.3.7.1
 */
export type AddGroupRequest = TypeFromSchema<typeof Groups.TlvAddGroupRequest>;

/**
 * The AddGroupResponse is sent by the Groups cluster server in response to an AddGroup command.
 *
 * @see {@link MatterSpecification.v11.Cluster} § 1.3.7.7
 */
export type AddGroupResponse = TypeFromSchema<typeof Groups.TlvAddGroupResponse>;

/**
 * The ViewGroup command allows a client to request that the server responds with a ViewGroupResponse command
 * containing the name string for a particular group.
 *
 * @see {@link MatterSpecification.v11.Cluster} § 1.3.7.2
 */
export type ViewGroupRequest = TypeFromSchema<typeof Groups.TlvViewGroupRequest>;

/**
 * The ViewGroupResponse command is sent by the Groups cluster server in response to a ViewGroup command.
 *
 * @see {@link MatterSpecification.v11.Cluster} § 1.3.7.8
 */
export type ViewGroupResponse = TypeFromSchema<typeof Groups.TlvViewGroupResponse>;

/**
 * The GetGroupMembership command allows a client to inquire about the group membership of the server endpoint, in a
 * number of ways.
 *
 * @see {@link MatterSpecification.v11.Cluster} § 1.3.7.3
 */
export type GetGroupMembershipRequest = TypeFromSchema<typeof Groups.TlvGetGroupMembershipRequest>;

/**
 * The GetGroupMembershipResponse command is sent by the Groups cluster server in response to a GetGroupMembership
 * command.
 *
 * The fields of the GetGroupMembershipResponse command have the following semantics:
 *
 * The Capacity field shall contain the remaining capacity of the Group Table of the node. The following values apply:
 *
 *   • 0 - No further groups may be added.
 *
 *   • 0 < Capacity < 0xfe - Capacity holds the number of groups that may be added.
 *
 *   • 0xfe - At least 1 further group may be added (exact number is unknown).
 *
 *   • null - It is unknown if any further groups may be added.
 *
 * The GroupList field shall contain either the group IDs of all the groups in the Group Table for which the server
 * endpoint is a member of the group (in the case where the GroupList field of the received GetGroupMembership command
 * was empty), or the group IDs of all the groups in the Group Table for which the server endpoint is a member of the
 * group and for which the group ID was included in the the GroupList field of the received GetGroupMembership command
 * (in the case where the GroupList field of the received GetGroupMembership command was not empty).
 *
 * Zigbee: If the total number of groups will cause the maximum payload length of a frame to be exceeded, then the
 * GroupList field shall contain only as many groups as will fit.
 *
 * @see {@link MatterSpecification.v11.Cluster} § 1.3.7.9
 */
export type GetGroupMembershipResponse = TypeFromSchema<typeof Groups.TlvGetGroupMembershipResponse>;

/**
 * The RemoveGroup command allows a client to request that the server removes the membership for the server endpoint,
 * if any, in a particular group.
 *
 * @see {@link MatterSpecification.v11.Cluster} § 1.3.7.4
 */
export type RemoveGroupRequest = TypeFromSchema<typeof Groups.TlvRemoveGroupRequest>;

/**
 * The RemoveGroupResponse command is generated by the server in response to the receipt of a RemoveGroup command.
 *
 * @see {@link MatterSpecification.v11.Cluster} § 1.3.7.10
 */
export type RemoveGroupResponse = TypeFromSchema<typeof Groups.TlvRemoveGroupResponse>;

/**
 * The AddGroupIfIdentifying command allows a client to add group membership in a particular group for the server
 * endpoint, on condition that the endpoint is identifying itself. Identifying functionality is controlled using the
 * Identify cluster, (see Identify).
 *
 * This command might be used to assist configuring group membership in the absence of a commissioning tool.
 *
 * @see {@link MatterSpecification.v11.Cluster} § 1.3.7.6
 */
export type AddGroupIfIdentifyingRequest = TypeFromSchema<typeof Groups.TlvAddGroupIfIdentifyingRequest>;

export namespace GroupsInterface {
    export interface Base {
        /**
         * The AddGroup command allows a client to add group membership in a particular group for the server endpoint.
         *
         * @see {@link MatterSpecification.v11.Cluster} § 1.3.7.1
         */
        addGroup(request: AddGroupRequest): MaybePromise<AddGroupResponse>;

        /**
         * The ViewGroup command allows a client to request that the server responds with a ViewGroupResponse command
         * containing the name string for a particular group.
         *
         * @see {@link MatterSpecification.v11.Cluster} § 1.3.7.2
         */
        viewGroup(request: ViewGroupRequest): MaybePromise<ViewGroupResponse>;

        /**
         * The GetGroupMembership command allows a client to inquire about the group membership of the server endpoint,
         * in a number of ways.
         *
         * @see {@link MatterSpecification.v11.Cluster} § 1.3.7.3
         */
        getGroupMembership(request: GetGroupMembershipRequest): MaybePromise<GetGroupMembershipResponse>;

        /**
         * The RemoveGroup command allows a client to request that the server removes the membership for the server
         * endpoint, if any, in a particular group.
         *
         * @see {@link MatterSpecification.v11.Cluster} § 1.3.7.4
         */
        removeGroup(request: RemoveGroupRequest): MaybePromise<RemoveGroupResponse>;

        /**
         * The RemoveAllGroups command allows a client to direct the server to remove all group associations for the
         * server endpoint.
         *
         * The RemoveAllGroups command has no data fields.
         *
         * @see {@link MatterSpecification.v11.Cluster} § 1.3.7.5
         */
        removeAllGroups(): MaybePromise;

        /**
         * The AddGroupIfIdentifying command allows a client to add group membership in a particular group for the
         * server endpoint, on condition that the endpoint is identifying itself. Identifying functionality is
         * controlled using the Identify cluster, (see Identify).
         *
         * This command might be used to assist configuring group membership in the absence of a commissioning tool.
         *
         * @see {@link MatterSpecification.v11.Cluster} § 1.3.7.6
         */
        addGroupIfIdentifying(request: AddGroupIfIdentifyingRequest): MaybePromise;
    }
}

export type GroupsInterface = { components: [{ flags: {}, methods: GroupsInterface.Base }] };
