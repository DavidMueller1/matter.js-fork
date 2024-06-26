[@project-chip/matter-node.js](../README.md) / [Modules](../modules.md) / [exports/model](../modules/exports_model.md) / Conformance

# Class: Conformance

[exports/model](../modules/exports_model.md).Conformance

An operational view of conformance as defined by the Matter Specification.

We extend the specification's syntax to add ">", "<", ">=" and "<=".  These are required to encode some portions of
the specification that are described in prose.

"Conformance" controls when a data field or cluster element is allowed or required.

## Hierarchy

- [`Aspect`](exports_model.Aspect.md)\<[`Definition`](../modules/exports_model.Conformance.md#definition)\>

  ↳ **`Conformance`**

## Table of contents

### Constructors

- [constructor](exports_model.Conformance-1.md#constructor)

### Properties

- [ast](exports_model.Conformance-1.md#ast)
- [definition](exports_model.Conformance-1.md#definition)
- [errors](exports_model.Conformance-1.md#errors)

### Accessors

- [empty](exports_model.Conformance-1.md#empty)
- [mandatory](exports_model.Conformance-1.md#mandatory)
- [type](exports_model.Conformance-1.md#type)
- [valid](exports_model.Conformance-1.md#valid)

### Methods

- [equals](exports_model.Conformance-1.md#equals)
- [error](exports_model.Conformance-1.md#error)
- [extend](exports_model.Conformance-1.md#extend)
- [isApplicable](exports_model.Conformance-1.md#isapplicable)
- [toString](exports_model.Conformance-1.md#tostring)
- [validateReferences](exports_model.Conformance-1.md#validatereferences)
- [valueOf](exports_model.Conformance-1.md#valueof)

## Constructors

### constructor

• **new Conformance**(`definition`): [`Conformance`](exports_model.Conformance-1.md)

Initialize from a Conformance.Definition or the conformance DSL defined by the Matter Specification.

#### Parameters

| Name | Type |
| :------ | :------ |
| `definition` | [`Definition`](../modules/exports_model.Conformance.md#definition) |

#### Returns

[`Conformance`](exports_model.Conformance-1.md)

#### Overrides

[Aspect](exports_model.Aspect.md).[constructor](exports_model.Aspect.md#constructor)

#### Defined in

packages/matter.js/dist/esm/model/aspects/Conformance.d.ts:23

## Properties

### ast

• **ast**: [`Ast`](../modules/exports_model.Conformance.md#ast)

#### Defined in

packages/matter.js/dist/esm/model/aspects/Conformance.d.ts:17

___

### definition

• **definition**: [`Definition`](../modules/exports_model.Conformance.md#definition)

#### Inherited from

[Aspect](exports_model.Aspect.md).[definition](exports_model.Aspect.md#definition)

#### Defined in

packages/matter.js/dist/esm/model/aspects/Aspect.d.ts:13

___

### errors

• `Optional` **errors**: [`DefinitionError`](../modules/exports_model.md#definitionerror)[]

#### Inherited from

[Aspect](exports_model.Aspect.md).[errors](exports_model.Aspect.md#errors)

#### Defined in

packages/matter.js/dist/esm/model/aspects/Aspect.d.ts:14

## Accessors

### empty

• `get` **empty**(): `boolean`

#### Returns

`boolean`

#### Overrides

Aspect.empty

#### Defined in

packages/matter.js/dist/esm/model/aspects/Conformance.d.ts:19

___

### mandatory

• `get` **mandatory**(): `boolean`

Is the associated element mandatory?

This supports a limited subset of conformance and is only appropriate for field and requirement conformance.

#### Returns

`boolean`

#### Defined in

packages/matter.js/dist/esm/model/aspects/Conformance.d.ts:30

___

### type

• `get` **type**(): [`Flag`](../enums/exports_model.Conformance.Flag.md) \| [`Special`](../enums/exports_model.Conformance.Special.md) \| [`NOT`](../enums/exports_model.Conformance.Operator.md#not) \| [`EQ`](../enums/exports_model.Conformance.Operator.md#eq) \| [`NE`](../enums/exports_model.Conformance.Operator.md#ne) \| [`OR`](../enums/exports_model.Conformance.Operator.md#or) \| [`XOR`](../enums/exports_model.Conformance.Operator.md#xor) \| [`AND`](../enums/exports_model.Conformance.Operator.md#and) \| [`GT`](../enums/exports_model.Conformance.Operator.md#gt) \| [`LT`](../enums/exports_model.Conformance.Operator.md#lt) \| [`GTE`](../enums/exports_model.Conformance.Operator.md#gte) \| [`LTE`](../enums/exports_model.Conformance.Operator.md#lte)

#### Returns

[`Flag`](../enums/exports_model.Conformance.Flag.md) \| [`Special`](../enums/exports_model.Conformance.Special.md) \| [`NOT`](../enums/exports_model.Conformance.Operator.md#not) \| [`EQ`](../enums/exports_model.Conformance.Operator.md#eq) \| [`NE`](../enums/exports_model.Conformance.Operator.md#ne) \| [`OR`](../enums/exports_model.Conformance.Operator.md#or) \| [`XOR`](../enums/exports_model.Conformance.Operator.md#xor) \| [`AND`](../enums/exports_model.Conformance.Operator.md#and) \| [`GT`](../enums/exports_model.Conformance.Operator.md#gt) \| [`LT`](../enums/exports_model.Conformance.Operator.md#lt) \| [`GTE`](../enums/exports_model.Conformance.Operator.md#gte) \| [`LTE`](../enums/exports_model.Conformance.Operator.md#lte)

#### Defined in

packages/matter.js/dist/esm/model/aspects/Conformance.d.ts:18

___

### valid

• `get` **valid**(): `boolean`

#### Returns

`boolean`

#### Inherited from

Aspect.valid

#### Defined in

packages/matter.js/dist/esm/model/aspects/Aspect.d.ts:15

## Methods

### equals

▸ **equals**(`other`): `boolean`

Test for logical equivalence.

#### Parameters

| Name | Type |
| :------ | :------ |
| `other` | `any` |

#### Returns

`boolean`

#### Inherited from

[Aspect](exports_model.Aspect.md).[equals](exports_model.Aspect.md#equals)

#### Defined in

packages/matter.js/dist/esm/model/aspects/Aspect.d.ts:21

___

### error

▸ **error**(`code`, `message`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `code` | `string` |
| `message` | `string` |

#### Returns

`void`

#### Inherited from

[Aspect](exports_model.Aspect.md).[error](exports_model.Aspect.md#error)

#### Defined in

packages/matter.js/dist/esm/model/aspects/Aspect.d.ts:24

___

### extend

▸ **extend**\<`This`\>(`this`, `other`): `This`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `This` | extends [`Aspect`](exports_model.Aspect.md)\<`any`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `this` | `This` |
| `other` | [`Definition`](../modules/exports_model.Conformance.md#definition) |

#### Returns

`This`

#### Inherited from

[Aspect](exports_model.Aspect.md).[extend](exports_model.Aspect.md#extend)

#### Defined in

packages/matter.js/dist/esm/model/aspects/Aspect.d.ts:25

___

### isApplicable

▸ **isApplicable**(`features`, `supportedFeatures`): `boolean`

Perform limited conformance evaluation to determine whether this conformance is applicable given a feature
combination.

Ignores subexpressions that reference field values.

This is useful for filtering elements at compile time.  For complete accuracy you then need to filter at runtime
once field values are known.

#### Parameters

| Name | Type |
| :------ | :------ |
| `features` | `Iterable`\<`string`\> |
| `supportedFeatures` | `Iterable`\<`string`\> |

#### Returns

`boolean`

#### Defined in

packages/matter.js/dist/esm/model/aspects/Conformance.d.ts:40

___

### toString

▸ **toString**(): `string`

#### Returns

`string`

#### Overrides

[Aspect](exports_model.Aspect.md).[toString](exports_model.Aspect.md#tostring)

#### Defined in

packages/matter.js/dist/esm/model/aspects/Conformance.d.ts:41

___

### validateReferences

▸ **validateReferences**(`lookup`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `lookup` | [`ReferenceResolver`](../modules/exports_model.Conformance.md#referenceresolver)\<`boolean`\> |

#### Returns

`void`

#### Defined in

packages/matter.js/dist/esm/model/aspects/Conformance.d.ts:24

___

### valueOf

▸ **valueOf**(): `string`

#### Returns

`string`

#### Inherited from

[Aspect](exports_model.Aspect.md).[valueOf](exports_model.Aspect.md#valueof)

#### Defined in

packages/matter.js/dist/esm/model/aspects/Aspect.d.ts:22
