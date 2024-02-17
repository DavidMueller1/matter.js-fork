/**
 * @license
 * Copyright 2022-2023 Project CHIP Authors
 * SPDX-License-Identifier: Apache-2.0
 */

/*** THIS FILE IS GENERATED, DO NOT EDIT ***/

import { MaybePromise } from "../../../util/Promises.js";
import { TypeFromSchema } from "../../../tlv/TlvSchema.js";
import { Actions } from "../../../cluster/definitions/ActionsCluster.js";
import { MatterCoreSpecificationV1_1 } from "../../../spec/Specifications.js";

/**
 * This command triggers an action (state change) on the involved endpoints, in a "fire and forget" manner. Afterwards,
 * the action’s state shall be Inactive.
 *
 * Example: recall a scene on a number of lights.
 *
 * @see {@link MatterCoreSpecificationV1_1} § 9.14.6.1
 */
export type InstantActionRequest = TypeFromSchema<typeof Actions.TlvInstantActionRequest>;

/**
 * It is recommended that, where possible (e.g., it is not possible for attributes with Boolean data type), a gradual
 * transition SHOULD take place from the old to the new state over this time period. However, the exact transition is
 * manufacturer dependent.
 *
 * This command triggers an action (state change) on the involved endpoints, with a specified time to transition from
 * the current state to the new state. During the transition, the action’s state shall be Active. Afterwards, the
 * action’s state shall be Inactive.
 *
 * Example: recall a scene on a number of lights, with a specified transition time.
 *
 * @see {@link MatterCoreSpecificationV1_1} § 9.14.6.2
 */
export type InstantActionWithTransitionRequest = TypeFromSchema<typeof Actions.TlvInstantActionWithTransitionRequest>;

/**
 * This command triggers the commencement of an action on the involved endpoints. Afterwards, the action’s state shall
 * be Active.
 *
 * Example: start a dynamic lighting pattern (such as gradually rotating the colors around the setpoints of the scene)
 * on a set of lights.
 *
 * Example: start a sequence of events such as a wake-up experience involving lights moving through several
 * brightness/color combinations and the window covering gradually opening.
 *
 * @see {@link MatterCoreSpecificationV1_1} § 9.14.6.3
 */
export type StartActionRequest = TypeFromSchema<typeof Actions.TlvStartActionRequest>;

/**
 * This command triggers the commencement of an action on the involved endpoints, and shall change the action’s state
 * to Active. After the specified Duration, the action will stop, and the action’s state shall change to Inactive.
 *
 * Example: start a dynamic lighting pattern (such as gradually rotating the colors around the setpoints of the scene)
 * on a set of lights for 1 hour (Duration=3600).
 *
 * @see {@link MatterCoreSpecificationV1_1} § 9.14.6.4
 */
export type StartActionWithDurationRequest = TypeFromSchema<typeof Actions.TlvStartActionWithDurationRequest>;

/**
 * This command stops the ongoing action on the involved endpoints. Afterwards, the action’s state shall be Inactive.
 *
 * Example: stop a dynamic lighting pattern which was previously started with StartAction.
 *
 * @see {@link MatterCoreSpecificationV1_1} § 9.14.6.5
 */
export type StopActionRequest = TypeFromSchema<typeof Actions.TlvStopActionRequest>;

/**
 * This command pauses an ongoing action, and shall change the action’s state to Paused.
 *
 * Example: pause a dynamic lighting effect (the lights stay at their current color) which was previously started with
 * StartAction.
 *
 * @see {@link MatterCoreSpecificationV1_1} § 9.14.6.6
 */
export type PauseActionRequest = TypeFromSchema<typeof Actions.TlvPauseActionRequest>;

/**
 * This command pauses an ongoing action, and shall change the action’s state to Paused. After the specified Duration,
 * the ongoing action will be automatically resumed. which shall change the action’s state to Active.
 *
 * Example: pause a dynamic lighting effect (the lights stay at their current color) for 10 minutes (Duration=600).
 *
 * The difference between Pause/Resume and Disable/Enable is on the one hand semantic (the former is more of a
 * transitionary nature while the latter is more permanent) and on the other hand these can be implemented slightly
 * differently in the implementation of the action (e.g. a Pause would be automatically resumed after some hours or
 * during a nightly reset, while an Disable would remain in effect until explicitly enabled again).
 *
 * This field shall indicate the requested duration in seconds.
 *
 * @see {@link MatterCoreSpecificationV1_1} § 9.14.6.7
 */
export type PauseActionWithDurationRequest = TypeFromSchema<typeof Actions.TlvPauseActionWithDurationRequest>;

/**
 * This command resumes a previously paused action, and shall change the action’s state to Active.
 *
 * The difference between ResumeAction and StartAction is that ResumeAction will continue the action from the state
 * where it was paused, while StartAction will start the action from the beginning.
 *
 * Example: resume a dynamic lighting effect (the lights' colors will change gradually, continuing from the point they
 * were paused).
 *
 * @see {@link MatterCoreSpecificationV1_1} § 9.14.6.8
 */
export type ResumeActionRequest = TypeFromSchema<typeof Actions.TlvResumeActionRequest>;

/**
 * This command enables a certain action or automation. Afterwards, the action’s state shall be Active.
 *
 * Example: enable a motion sensor to control the lights in an area.
 *
 * @see {@link MatterCoreSpecificationV1_1} § 9.14.6.9
 */
export type EnableActionRequest = TypeFromSchema<typeof Actions.TlvEnableActionRequest>;

/**
 * This command enables a certain action or automation, and shall change the action’s state to be Active. After the
 * specified Duration, the action or automation will stop, and the action’s state shall change to Disabled.
 *
 * Example: enable a "presence mimicking" behavior for the lights in your home during a vacation; the Duration field is
 * used to indicated the length of your absence from home. After that period, the presence mimicking behavior will no
 * longer control these lights.
 *
 * This field shall indicate the requested duration in seconds.
 *
 * @see {@link MatterCoreSpecificationV1_1} § 9.14.6.10
 */
export type EnableActionWithDurationRequest = TypeFromSchema<typeof Actions.TlvEnableActionWithDurationRequest>;

/**
 * This command disables a certain action or automation, and shall change the action’s state to Inactive.
 *
 * Example: disable a motion sensor to no longer control the lights in an area.
 *
 * @see {@link MatterCoreSpecificationV1_1} § 9.14.6.11
 */
export type DisableActionRequest = TypeFromSchema<typeof Actions.TlvDisableActionRequest>;

/**
 * This command disables a certain action or automation, and shall change the action’s state to Disabled. After the
 * specified Duration, the action or automation will re-start, and the action’s state shall change to either Inactive
 * or Active, depending on the actions (see examples 4 and 6).
 *
 * Example: disable a "wakeup" experience for a period of 1 week when going on holiday (to prevent them from turning on
 * in the morning while you’re not at home). After this period, the wakeup experience will control the lights as before.
 *
 * This field shall indicate the requested duration in seconds.
 *
 * @see {@link MatterCoreSpecificationV1_1} § 9.14.6.12
 */
export type DisableActionWithDurationRequest = TypeFromSchema<typeof Actions.TlvDisableActionWithDurationRequest>;

export namespace ActionsInterface {
    export interface Base {
        /**
         * This command triggers an action (state change) on the involved endpoints, in a "fire and forget" manner.
         * Afterwards, the action’s state shall be Inactive.
         *
         * Example: recall a scene on a number of lights.
         *
         * @see {@link MatterCoreSpecificationV1_1} § 9.14.6.1
         */
        instantAction(request: InstantActionRequest): MaybePromise;

        /**
         * It is recommended that, where possible (e.g., it is not possible for attributes with Boolean data type), a
         * gradual transition SHOULD take place from the old to the new state over this time period. However, the exact
         * transition is manufacturer dependent.
         *
         * This command triggers an action (state change) on the involved endpoints, with a specified time to
         * transition from the current state to the new state. During the transition, the action’s state shall be
         * Active. Afterwards, the action’s state shall be Inactive.
         *
         * Example: recall a scene on a number of lights, with a specified transition time.
         *
         * @see {@link MatterCoreSpecificationV1_1} § 9.14.6.2
         */
        instantActionWithTransition(request: InstantActionWithTransitionRequest): MaybePromise;

        /**
         * This command triggers the commencement of an action on the involved endpoints. Afterwards, the action’s
         * state shall be Active.
         *
         * Example: start a dynamic lighting pattern (such as gradually rotating the colors around the setpoints of the
         * scene) on a set of lights.
         *
         * Example: start a sequence of events such as a wake-up experience involving lights moving through several
         * brightness/color combinations and the window covering gradually opening.
         *
         * @see {@link MatterCoreSpecificationV1_1} § 9.14.6.3
         */
        startAction(request: StartActionRequest): MaybePromise;

        /**
         * This command triggers the commencement of an action on the involved endpoints, and shall change the action’s
         * state to Active. After the specified Duration, the action will stop, and the action’s state shall change to
         * Inactive.
         *
         * Example: start a dynamic lighting pattern (such as gradually rotating the colors around the setpoints of the
         * scene) on a set of lights for 1 hour (Duration=3600).
         *
         * @see {@link MatterCoreSpecificationV1_1} § 9.14.6.4
         */
        startActionWithDuration(request: StartActionWithDurationRequest): MaybePromise;

        /**
         * This command stops the ongoing action on the involved endpoints. Afterwards, the action’s state shall be
         * Inactive.
         *
         * Example: stop a dynamic lighting pattern which was previously started with StartAction.
         *
         * @see {@link MatterCoreSpecificationV1_1} § 9.14.6.5
         */
        stopAction(request: StopActionRequest): MaybePromise;

        /**
         * This command pauses an ongoing action, and shall change the action’s state to Paused.
         *
         * Example: pause a dynamic lighting effect (the lights stay at their current color) which was previously
         * started with StartAction.
         *
         * @see {@link MatterCoreSpecificationV1_1} § 9.14.6.6
         */
        pauseAction(request: PauseActionRequest): MaybePromise;

        /**
         * This command pauses an ongoing action, and shall change the action’s state to Paused. After the specified
         * Duration, the ongoing action will be automatically resumed. which shall change the action’s state to Active.
         *
         * Example: pause a dynamic lighting effect (the lights stay at their current color) for 10 minutes
         * (Duration=600).
         *
         * The difference between Pause/Resume and Disable/Enable is on the one hand semantic (the former is more of a
         * transitionary nature while the latter is more permanent) and on the other hand these can be implemented
         * slightly differently in the implementation of the action (e.g. a Pause would be automatically resumed after
         * some hours or during a nightly reset, while an Disable would remain in effect until explicitly enabled
         * again).
         *
         * This field shall indicate the requested duration in seconds.
         *
         * @see {@link MatterCoreSpecificationV1_1} § 9.14.6.7
         */
        pauseActionWithDuration(request: PauseActionWithDurationRequest): MaybePromise;

        /**
         * This command resumes a previously paused action, and shall change the action’s state to Active.
         *
         * The difference between ResumeAction and StartAction is that ResumeAction will continue the action from the
         * state where it was paused, while StartAction will start the action from the beginning.
         *
         * Example: resume a dynamic lighting effect (the lights' colors will change gradually, continuing from the
         * point they were paused).
         *
         * @see {@link MatterCoreSpecificationV1_1} § 9.14.6.8
         */
        resumeAction(request: ResumeActionRequest): MaybePromise;

        /**
         * This command enables a certain action or automation. Afterwards, the action’s state shall be Active.
         *
         * Example: enable a motion sensor to control the lights in an area.
         *
         * @see {@link MatterCoreSpecificationV1_1} § 9.14.6.9
         */
        enableAction(request: EnableActionRequest): MaybePromise;

        /**
         * This command enables a certain action or automation, and shall change the action’s state to be Active. After
         * the specified Duration, the action or automation will stop, and the action’s state shall change to Disabled.
         *
         * Example: enable a "presence mimicking" behavior for the lights in your home during a vacation; the Duration
         * field is used to indicated the length of your absence from home. After that period, the presence mimicking
         * behavior will no longer control these lights.
         *
         * This field shall indicate the requested duration in seconds.
         *
         * @see {@link MatterCoreSpecificationV1_1} § 9.14.6.10
         */
        enableActionWithDuration(request: EnableActionWithDurationRequest): MaybePromise;

        /**
         * This command disables a certain action or automation, and shall change the action’s state to Inactive.
         *
         * Example: disable a motion sensor to no longer control the lights in an area.
         *
         * @see {@link MatterCoreSpecificationV1_1} § 9.14.6.11
         */
        disableAction(request: DisableActionRequest): MaybePromise;

        /**
         * This command disables a certain action or automation, and shall change the action’s state to Disabled. After
         * the specified Duration, the action or automation will re-start, and the action’s state shall change to
         * either Inactive or Active, depending on the actions (see examples 4 and 6).
         *
         * Example: disable a "wakeup" experience for a period of 1 week when going on holiday (to prevent them from
         * turning on in the morning while you’re not at home). After this period, the wakeup experience will control
         * the lights as before.
         *
         * This field shall indicate the requested duration in seconds.
         *
         * @see {@link MatterCoreSpecificationV1_1} § 9.14.6.12
         */
        disableActionWithDuration(request: DisableActionWithDurationRequest): MaybePromise;
    }
}

export type ActionsInterface = { components: [{ flags: {}, methods: ActionsInterface.Base }] };
