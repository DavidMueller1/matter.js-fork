/**
 * @license
 * Copyright 2022-2023 Project CHIP Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Behavior } from "../behavior/Behavior.js";
import { ActionTracer } from "../behavior/context/ActionTracer.js";
import { OfflineContext } from "../behavior/context/server/OfflineContext.js";
import { CrashedDependencyError, Lifecycle, UninitializedDependencyError } from "../common/Lifecycle.js";
import { ImplementationError } from "../common/MatterError.js";
import { EndpointNumber } from "../datatype/EndpointNumber.js";
import { Environment } from "../environment/Environment.js";
import { Diagnostic } from "../log/Diagnostic.js";
import { Logger } from "../log/Logger.js";
import type { Node } from "../node/Node.js";
import { IdentityService } from "../node/server/IdentityService.js";
import { AsyncConstruction } from "../util/AsyncConstruction.js";
import { MaybePromise } from "../util/Promises.js";
import { Agent } from "./Agent.js";
import { DataModelPath } from "./DataModelPath.js";
import { RootEndpoint } from "./definitions/system/RootEndpoint.js";
import { Behaviors } from "./properties/Behaviors.js";
import { EndpointInitializer } from "./properties/EndpointInitializer.js";
import { EndpointLifecycle } from "./properties/EndpointLifecycle.js";
import { Parts } from "./properties/Parts.js";
import { SupportedBehaviors } from "./properties/SupportedBehaviors.js";
import { EndpointType } from "./type/EndpointType.js";

const logger = Logger.get("Endpoint");

/**
 * Endpoints consist of a hierarchy of parts.  This class manages the current state of a single endpoint.
 *
 * You can interact with endpoints using an {@link Agent} created with {@link Endpoint.agentFor}.  Agents are stateless and
 * designed for quick instantiation so you can create them as needed then discard.
 *
 * Most often direct access to {@link Agent} is transparent as Matter.js acquires an agent as necessary for
 * {@link Behavior} interactions.
 */
export class Endpoint<T extends EndpointType = EndpointType.Empty> {
    #type: EndpointType;
    #id?: string;
    #number?: EndpointNumber;
    #owner?: Endpoint;
    #agentType?: Agent.Type<T>;
    #behaviors?: Behaviors;
    #lifecycle: EndpointLifecycle;
    #parts?: Parts;
    #construction: AsyncConstruction<Endpoint<T>>;
    #stateView = {} as SupportedBehaviors.StateOf<T["behaviors"]>;
    #eventsView = {} as SupportedBehaviors.EventsOf<T["behaviors"]>;

    /**
     * A string that uniquely identifies an endpoint.
     *
     * This ID must be unique amongst all Parts with the same owner.
     */
    get id() {
        if (this.#id === undefined) {
            throw new UninitializedDependencyError(
                this.toString(),
                "endpoint ID is not yet assigned; set ID or await endpoint.construction to avoid this error",
            );
        }
        return this.#id;
    }

    /**
     * The Matter {@link EndpointNumber} of the endpoint.  This uniquely identifies the {@link Endpoint} in the scope of the
     * Matter node.
     */
    get number(): EndpointNumber {
        if (this.#number === undefined) {
            throw new UninitializedDependencyError(
                this.toString(),
                "endpoint number is not yet assigned; set number or await endpoint.construction to avoid this error",
            );
        }
        return this.#number;
    }

    /**
     * The owner of the endpoint.
     *
     * Every endpoint but the root endpoint (the "node") is owned by another endpoint.
     */
    get owner(): Endpoint | undefined {
        return this.#owner;
    }

    /**
     * The endpoint's environment.  Endpoint implementations use the environment to access platform components such as
     * storage and network components.
     */
    get env(): Environment {
        if (this.owner) {
            return this.owner.env;
        }
        return Environment.default;
    }

    /**
     * Access the pool of behaviors supported by this endpoint.
     */
    get behaviors() {
        if (this.#behaviors === undefined) {
            throw new UninitializedDependencyError(
                this.toString(),
                "behaviors are not yet initialized; await endpoint.construction to avoid this error",
            );
        }
        return this.#behaviors;
    }

    /**
     * Current state values for all behaviors, keyed by behavior ID.  This view is read-only.
     */
    get state() {
        return this.#stateView;
    }

    /**
     * Current state for a specific behavior.
     */
    stateOf<T extends Behavior.Type>(type: T) {
        if (!this.behaviors.has(type)) {
            throw new ImplementationError(`Behavior ${type.id} is not supported by this endpoint`);
        }
        return this.#stateView[type.id] as Behavior.StateOf<T>;
    }

    /**
     * Update state values.  This is a patch operation; it only modifies properties in {@link values}.
     *
     * {@link values} is an object with a {@link Behavior.id} as the key and state values as sub-objects.
     *
     * Input values must adhere to the {@link Behavior.schema} of the target {@link Behavior}.  If not, set will throw
     * an error.
     *
     * This is a transactional operation.  An error results in no change.  The endpoint will wait for exclusive access
     * before applying changes.
     *
     * @param values the values to change
     */
    async set(values: SupportedBehaviors.StatePatchOf<T["behaviors"]>) {
        await this.act(async agent => {
            const tx = agent.context.transaction;

            await tx.begin();

            for (const behaviorId in values) {
                const behavior = agent[behaviorId];
                if (!(behavior instanceof Behavior)) {
                    throw new ImplementationError(`Behavior ID ${behaviorId} does not exist`);
                }

                const vals = values[behaviorId];
                if (vals === undefined) {
                    continue;
                }

                await tx.addResources(behavior);

                const patch = (behavior.constructor as Behavior.Type).supervisor.patch;

                patch(vals, behavior.state, this.path);
            }
        });
    }

    /**
     * Update state values for a single behavior.
     *
     * The patch semantics used here are identical to {@link set}.
     *
     * @param type the {@link Behavior} to patch
     * @param values the values to change
     */
    async setStateOf<T extends Behavior.Type>(type: T, values: Behavior.PatchStateOf<T>) {
        await this.act(async agent => {
            const behavior = agent.get(type);

            const tx = agent.context.transaction;
            await tx.begin();
            await tx.addResources(behavior);

            const patch = (behavior.constructor as Behavior.Type).supervisor.patch;

            patch(values, behavior.state, this.path);
        });
    }

    /**
     * Events for all behaviors keyed by behavior ID.
     */
    get events() {
        return this.#eventsView;
    }

    /**
     * Events for a specific behavior.
     */
    eventsOf<T extends Behavior.Type>(type: T) {
        if (!this.behaviors.has(type)) {
            throw new ImplementationError(`Behavior ${type.id} is not supported by this endpoint`);
        }
        return this.#eventsView[type.id] as Behavior.EventsOf<T>;
    }

    get construction() {
        return this.#construction;
    }

    /**
     * Create new endpoint.
     *
     * The endpoint will not initialize fully until added to a {@link Node}.  You can use {@link Endpoint.add} to construct
     * and initialize a {@link Endpoint} in one step.
     *
     * @param config
     */
    constructor(config: Endpoint.Configuration<T> | T);

    /**
     * Create new endpoint.
     *
     * The endpoint will not initialize fully until added to a {@link Node}.  You can use {@link Endpoint.add} to construct
     * and initialize a {@link Endpoint} in one step.
     *
     * @param config
     */
    constructor(type: T, options?: Endpoint.Options<T>);

    constructor(definition: T | Endpoint.Configuration<T>, options?: Endpoint.Options<T>) {
        // Create construction early so endpoints and behaviors can hook events
        this.#construction = AsyncConstruction(this);

        const config = Endpoint.configurationFor(definition, options);

        this.#type = config.type;
        this.#lifecycle = this.createLifecycle();

        this.#lifecycle.ready.on(() => this.#logReady());

        this.#behaviors = new Behaviors(this, this.#type.behaviors, config as Record<string, object | undefined>);

        if (config.id !== undefined) {
            this.id = config.id;
        }

        if (config.number !== undefined) {
            this.number = config.number;
        }

        if (config.owner) {
            this.owner = config.owner instanceof Agent ? config.owner.endpoint : config.owner;
        }

        if (config.parts) {
            for (const part of config.parts) {
                this.parts.add(part);
            }
        }

        this.#construction.start(() => {
            if (this.lifecycle.isInstalled) {
                // Immediate initialization
                return this.#initialize();
            }

            // Deferred initialization -- wait for installation
            return new Promise<void>((fulfilled, rejected) => {
                this.lifecycle.installed.once(() => {
                    MaybePromise.then(() => this.#initialize(), fulfilled, rejected);
                });
            });
        });
    }

    set id(id: string) {
        if (this.#id === id) {
            return;
        }
        if (this.#id !== undefined) {
            throw new ImplementationError(`${this} ID is already assigned, cannot reassign`);
        }
        if (typeof id !== "string") {
            throw new ImplementationError(`Illegal endpoint ID type "${typeof id}"`);
        }
        if (id === "") {
            throw new ImplementationError("Endpoint ID may not be empty");
        }
        if (id.includes(".")) {
            throw new ImplementationError('Endpoint ID may not include "."');
        }

        if (this.lifecycle.isInstalled && this.owner instanceof Endpoint) {
            this.owner.parts.assertIdAvailable(id, this);
        }

        this.#id = id;
        this.lifecycle.change(EndpointLifecycle.Change.IdAssigned);
    }

    set number(number: number) {
        if (this.#number === number) {
            return;
        }
        if (this.#number !== undefined) {
            throw new ImplementationError(
                `${this} endpoint number ${this.#number} is already assigned, cannot reassign`,
            );
        }
        if (typeof number !== "number") {
            throw new ImplementationError(`Illegal endpoint number type "${typeof number}"`);
        }
        if (!Number.isInteger(number)) {
            throw new ImplementationError(`Endpoint number ${number} is not an integer`);
        }
        if (number < 0) {
            throw new ImplementationError(`Endpoint number ${number} is negative`);
        }
        if (number > 0xffff) {
            throw new ImplementationError(`Endpoint number ${number} is greater than the maximum of 65535`);
        }

        if (this.type.deviceClass === RootEndpoint.deviceClass) {
            if (number !== 0) {
                throw new ImplementationError("The root endpoint must have ID 0");
            }
        } else {
            if (number === 0) {
                throw new ImplementationError("Only root endpoint may have ID 0");
            }

            if (this.lifecycle.isInstalled) {
                this.env.get(IdentityService).assertNumberAvailable(number, this);
            }
        }

        this.#number = EndpointNumber(number);

        this.lifecycle.change(EndpointLifecycle.Change.NumberAssigned);
    }

    set owner(owner: Endpoint | undefined) {
        if (this.#owner === owner) {
            return;
        }
        if (this.#owner) {
            throw new ImplementationError("Endpoint owner cannot be reassigned");
        }
        if (owner === undefined) {
            throw new ImplementationError("Endpoint owner must be defined");
        }

        this.#owner = owner;

        try {
            owner.parts.add(this);
        } catch (e) {
            this.#owner = undefined;
            throw e;
        }
    }

    /**
     * Add a child endpoint.
     *
     * @param config the {@link Endpoint} or {@link Endpoint.Configuration}
     */
    async add<T extends EndpointType>(endpoint: Endpoint<T> | Endpoint.Configuration<T> | T): Promise<Endpoint<T>>;

    /**
     * Add a child endpoint.
     *
     * @param type the {@link EndpointType} of the child endpoint
     * @param options settings for the new endpoint
     */
    async add<T extends EndpointType>(type: T, options?: Endpoint.Options<T>): Promise<Endpoint<T>>;

    async add<T extends EndpointType>(
        definition: T | Endpoint<T> | Endpoint.Configuration<T>,
        options?: Endpoint.Options<T>,
    ) {
        let endpoint;
        if (definition instanceof Endpoint) {
            endpoint = definition;
        } else {
            endpoint = new Endpoint(definition as any, options);
        }

        this.parts.add(endpoint);

        await endpoint.construction;

        return endpoint;
    }

    /**
     * The type of endpoint this endpoint implements.
     */
    get type() {
        return this.#type;
    }

    /**
     * Access child parts.
     */
    get parts() {
        if (!this.#parts) {
            this.#parts = new Parts(this);
        }
        return this.#parts;
    }

    /**
     * Is this a parent Endpoint?
     */
    get hasParts() {
        return !!this.#parts?.size;
    }

    /**
     * Endpoint information that varies as the endpoint initializes.
     */
    get lifecycle() {
        return this.#lifecycle;
    }

    protected createLifecycle() {
        return new EndpointLifecycle(this);
    }

    /**
     * Create an {@link Agent.Type} for the endpoint.
     */
    get agentType() {
        if (!this.#agentType) {
            this.#agentType = Agent.for(this.type, this.behaviors.supported);
        }
        return this.#agentType;
    }

    /**
     * Execute a function against an {@link Agent} for the endpoint.
     *
     * Agents provide the highest-leve API for interacting with endpoints.  The agent is a composite object with
     * properties for each supported behavior.
     *
     * State changes made by {@link actor} are atomic and made permanent only when the actor exits unless you commit the
     * transaction manually.
     *
     * {@link actor} runs in an "offline" context where ACLs are ignored and all state is read/write.
     *
     * The {@link Agent} is destroyed after {@link actor} exits so you should not maintain references to the agent, its
     * behaviors or associated state.
     */
    act<R>(actor: (agent: Agent.Instance<T>) => MaybePromise<R>): MaybePromise<R> {
        this.construction.assert("Endpoint");

        return OfflineContext.act("offline", context => {
            return actor(context.agentFor(this));
        });
    }

    /**
     * Perform "soft" reset of the endpoint, reverting all in-memory structures to uninitialized.
     */
    async reset() {
        // Revert lifecycle to uninitialized
        this.lifecycle.resetting();

        // Reset child parts
        for (const endpoint of this.parts) {
            await endpoint.reset();
        }

        // Reset behaviors
        await this.behaviors.reset();

        // Notify
        await this.lifecycle.reset.emit();

        // Set construction to inactive so we can restart
        this.construction.setStatus(Lifecycle.Status.Inactive);

        // The endpoint will defer construction until it is notified of installation by a node
        this.construction.start();
    }

    /**
     * Apply a depth-first visitor function to myself and all descendents.
     */
    visit(visitor: (endpoint: Endpoint) => void) {
        visitor(this);
        if (this.hasParts) {
            for (const part of this.parts) {
                part.visit(visitor);
            }
        }
    }

    async close() {
        await this.construction.close(async () => {
            await this.parts.close();
            await this.behaviors.close();
            this.lifecycle.change(EndpointLifecycle.Change.Destroyed);
            this.#owner = undefined;
        });
    }

    async [Symbol.asyncDispose]() {
        await this.close();
    }

    toString() {
        return this.path.toString();
    }

    /**
     * Path identifying the endpoint in the Matter data model.
     */
    get path(): DataModelPath {
        let ident;
        if (this.lifecycle.hasId) {
            ident = this.id;
        } else if (this.lifecycle.hasNumber) {
            ident = this.number;
        } else {
            ident = "?";
        }

        if (this.#owner) {
            return this.#owner.path.at(ident, this.#type.name);
        }

        return DataModelPath(ident, this.type.name);
    }

    /**
     * Asynchronous initialization.
     *
     * Derivatives may override to perform async construction prior to full initialization.
     */
    protected initialize(agent: Agent.Instance<T>) {
        this.env.get(EndpointInitializer).initializeDescendent(this);
        return this.behaviors.initialize(agent);
    }

    /**
     * Invoked if one or more behaviors crashed during initialization.
     *
     * The default implementation crashes the endpoint.
     */
    protected behaviorCrash() {
        this.construction.then(() => {
            logger.info(
                "Endpoint",
                Diagnostic.strong(this.toString()),
                "initialization failed because of errors in behaviors",
            );

            this.#construction.crashed(
                new CrashedDependencyError(this.toString(), "unavailable due to behavior initialization failure"),

                // We do not want this error logged
                false,
            );
        });
    }

    #initialize() {
        let trace: ActionTracer.Action;
        if (this.env.has(ActionTracer)) {
            trace = {
                type: ActionTracer.ActionType.Initialize,
            };
        }

        return MaybePromise.then(
            // Initialize myself and behaviors in a single offline transaction
            () =>
                OfflineContext.act(`initialize`, context => this.initialize(context.agentFor(this)), {
                    unversionedVolatiles: true,
                    trace,
                }),

            // Update lifecycle indicating initialization is complete
            () => {
                this.lifecycle.change(EndpointLifecycle.Change.Ready);
                if (trace) {
                    trace.path = this.path;
                    this.env.get(ActionTracer).record(trace);
                }

                if (this.behaviors.hasCrashed) {
                    this.behaviorCrash();
                }
            },
        );
    }

    #logReady() {
        logger.info(Diagnostic.strong(this.toString()), "ready", this.diagnosticDict);
    }

    /**
     * Diagnostic information regarding endpoint state.
     */
    get diagnosticDict() {
        return Diagnostic.dict({
            "endpoint#": this.number,
            type: `${this.type.name} (0x${this.type.deviceType.toString(16)})`,
            behaviors: this.behaviors,
        });
    }
}

export namespace Endpoint {
    export type BehaviorOptions<T extends EndpointType = EndpointType.Empty, O extends PartOptions = PartOptions> = {
        [K in keyof T["behaviors"] as K extends keyof O ? never : K]?: Behavior.Options<T["behaviors"][K]>;
    };

    export interface PartOptions {
        owner?: Endpoint | Agent;
        id?: string;
        number?: number;
        parts?: Iterable<Endpoint.Definition>;
    }

    export type Options<
        T extends EndpointType = EndpointType.Empty,
        O extends PartOptions = PartOptions,
    > = BehaviorOptions<T, O> & O;

    export type Configuration<
        T extends EndpointType = EndpointType.Empty,
        O extends PartOptions = PartOptions,
    > = Options<T, O & { type: T }> & { type: T };

    /**
     * Definition of an endpoint.  May be an {@link EndpointType}, {@link Configuration}, or a {@link Endpoint}
     * instance.
     */
    export type Definition<T extends EndpointType = EndpointType.Empty> = T | Configuration<T> | Endpoint<T>;

    /**
     * Obtain a configuration from constructor parameters.
     */
    export function configurationFor<T extends EndpointType>(
        definition: T | Endpoint.Configuration<T>,
        options?: Endpoint.Options<T>,
    ) {
        if ((definition as EndpointType).deviceType) {
            return {
                ...options,
                type: definition as T,
            } as Configuration<T>;
        }
        return definition as Configuration<T>;
    }

    /**
     * Obtain an endpoint for the given {@link Definition}.
     */
    export function partFor<T extends EndpointType>(definition: Definition<T>): Endpoint<T> {
        if (definition instanceof Endpoint) {
            return definition;
        }

        return new Endpoint(definition);
    }
}