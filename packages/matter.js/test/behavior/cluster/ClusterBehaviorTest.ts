/**
 * @license
 * Copyright 2022-2023 Project CHIP Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Behavior } from "../../../src/behavior/Behavior.js";
import { ClusterBehavior } from "../../../src/behavior/cluster/ClusterBehavior.js";
import { ActionContext } from "../../../src/behavior/context/ActionContext.js";
import { NetworkCommissioningServer } from "../../../src/behavior/definitions/network-commissioning/NetworkCommissioningServer.js";
import { StateType } from "../../../src/behavior/state/StateType.js";
import { ElementModifier } from "../../../src/cluster/mutation/ElementModifier.js";
import { ClusterModel } from "../../../src/model/index.js";
import { Observable } from "../../../src/util/Observable.js";
import { MaybePromise } from "../../../src/util/Promises.js";
import { MockPart } from "../../endpoint/mock-part.js";
import { My, MyBehavior, MyCluster } from "./cluster-behavior-test-util.js";

describe("ClusterBehavior", () => {
    type Match<Input, Type> = Input extends Type ? true : false;

    describe("base class", () => {
        describe("state types meet type requirement", () => {
            ClusterBehavior.State satisfies StateType;
            ClusterBehavior.State satisfies ClusterBehavior.Type["State"];
        });

        describe("meets type requirements", () => {
            ClusterBehavior satisfies Behavior.Type;

            ({}) as ClusterBehavior["state"] satisfies InstanceType<ClusterBehavior.Type>["state"];
            ({}) as ClusterBehavior["events"] satisfies InstanceType<ClusterBehavior.Type>["events"];

            ClusterBehavior.State satisfies ClusterBehavior.Type["State"];
            ClusterBehavior.Events satisfies ClusterBehavior.Type["Events"];

            typeof ClusterBehavior.State === "function";
            typeof ClusterBehavior.Events === "function";

            ClusterBehavior satisfies ClusterBehavior.Type;
            typeof ClusterBehavior === "function";
        });
    });

    describe("for", () => {
        it("exposes mandatory properties for enabled cluster elements", () => {
            MyBehavior satisfies { id: "myCluster" };

            ({}) as MyBehavior satisfies {
                state: {
                    reqAttr: string;
                };
            };
            expect(new MyBehavior.State().reqAttr).equals("hello");

            ({}) as MyBehavior satisfies {
                reqCmd: (request: string, state: any) => MaybePromise<string>;
                becomeAwesome?: undefined;
            };
            expect(typeof MyBehavior.prototype.reqCmd).equals("function");
            expect((MyBehavior.prototype as any).becomeAwesome).equals(undefined);

            ({}) as MyBehavior satisfies {
                events: {
                    reqAttr$Change: Observable<[value: string, oldValue: string, context?: ActionContext]>;
                };
            };

            ({}) as MyBehavior satisfies {
                events: {
                    reqEv: Observable<[string, context?: ActionContext]>;
                };
            };
        });

        it("maintains ID after second for", () => {
            const ForBehavior = MyBehavior.for(MyCluster);
            ForBehavior.id satisfies "myCluster";
        });

        it("exposes optional properties for disabled cluster elements", () => {
            undefined satisfies MyBehavior["state"]["optAttr"];
            true satisfies MyBehavior["state"]["optAttr"];
            (() => true) satisfies MyBehavior["optCmd"];
            ((..._args: any[]) => true) satisfies MyBehavior["optCmd"];
            ({}) as Match<MyBehavior["events"], { optAttr$Change: {} }> satisfies false;
            ({}) as Match<MyBehavior["events"], { optEv: {} }> satisfies false;
            ({}) as Match<MyBehavior, { optCmd: (...args: any[]) => any }> satisfies true;
        });

        it("instance exposes values for enabled cluster elements", async () => {
            const part = await MockPart.createWith(MyBehavior);
            part.act(agent => {
                const behavior = agent.myCluster;
                expect(behavior.state.reqAttr).equals("hello");
                expect(behavior.reqCmd).is.a("function");
                expect(behavior.events.reqAttr$Change.constructor.name).equals("Emitter");
                expect(behavior.events.reqEv.constructor.name).equals("Emitter");
            });
        });

        it("instance does not expose values for disabled cluster elements", async () => {
            const part = await MockPart.createWith(MyBehavior);
            part.act(agent => {
                const behavior = agent.myCluster;
                expect(behavior.state.optAttr).undefined;
                expect(behavior.events.optAttr$Change?.constructor.name).equals("Emitter");
                expect(behavior.events.optEv).undefined;
            });
        });

        it("instance allows standard method override", () => {
            const Ignored = class extends MyBehavior {
                override reqCmd(request: string): string {
                    return request.toUpperCase();
                }

                override optCmd(request: boolean): boolean {
                    return !request;
                }
            };
            Ignored;
        });
    });

    describe("set", () => {
        it("recreates type", () => {
            const SetBehavior = MyBehavior.set({});
            SetBehavior.id satisfies "myCluster";
            expect(SetBehavior.id).equals("myCluster");
        });
    });

    describe("alter", () => {
        it("recreates ID", () => {
            // Test constituent parts
            MyCluster.name satisfies "MyCluster";

            const AlteredCluster = new ElementModifier(MyCluster).alter({});
            AlteredCluster.name satisfies "MyCluster";

            const BehaviorForAlteredCluster = MyBehavior.for(AlteredCluster);
            BehaviorForAlteredCluster.id satisfies "myCluster";

            // Now test all together
            const AlteredBehavior = MyBehavior.alter({});
            AlteredBehavior.id satisfies "myCluster";
            expect(AlteredBehavior.id).equals("myCluster");
        });
    });

    describe("with", () => {
        it("recreates ID", () => {
            const AwesomeBehavior = MyBehavior.with("Awesome");
            AwesomeBehavior.id satisfies "myCluster";
            expect(AwesomeBehavior.id).equals("myCluster");
        });

        it("adds feature elements", () => {
            const AwesomeBehavior = MyBehavior.with(My.Feature.Awesome);

            ({}) as InstanceType<typeof AwesomeBehavior> satisfies {
                state: {
                    awesomeSauce: number;
                };

                becomeAwesome(value: number): void;

                events: {
                    becameAwesome: Observable<[number, ActionContext]>;
                };
            };

            expect(AwesomeBehavior.cluster.supportedFeatures).deep.equals({ awesome: true });
            expect((AwesomeBehavior.schema as ClusterModel).supportedFeatures).deep.equals(new Set(["awesome"]));
        });

        it("allows extension and base command overrides", () => {
            const AwesomeBehavior = MyBehavior.with(My.Feature.Awesome);
            class AwesomeServer extends AwesomeBehavior {
                override reqCmd(): string {
                    return "hi";
                }

                override becomeAwesome(_value: number) {}
            }
            AwesomeServer;
        });

        it("adds feature elements on NetworkCommissioningServer", () => {
            const EthernetCommissioningServer = NetworkCommissioningServer.with("EthernetNetworkInterface");

            expect(EthernetCommissioningServer.cluster.supportedFeatures.ethernetNetworkInterface).true;
            expect(EthernetCommissioningServer.cluster.supportedFeatures.wiFiNetworkInterface).false;
            expect(EthernetCommissioningServer.cluster.supportedFeatures.threadNetworkInterface).false;
        });
    });
});
