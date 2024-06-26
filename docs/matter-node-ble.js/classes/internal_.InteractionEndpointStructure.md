[@project-chip/matter-node-ble.js](../README.md) / [Exports](../modules.md) / [\<internal\>](../modules/internal_.md) / InteractionEndpointStructure

# Class: InteractionEndpointStructure

[\<internal\>](../modules/internal_.md).InteractionEndpointStructure

## Table of contents

### Constructors

- [constructor](internal_.InteractionEndpointStructure.md#constructor)

### Properties

- [attributePaths](internal_.InteractionEndpointStructure.md#attributepaths)
- [attributes](internal_.InteractionEndpointStructure.md#attributes)
- [change](internal_.InteractionEndpointStructure.md#change)
- [commandPaths](internal_.InteractionEndpointStructure.md#commandpaths)
- [commands](internal_.InteractionEndpointStructure.md#commands)
- [endpoints](internal_.InteractionEndpointStructure.md#endpoints)
- [eventPaths](internal_.InteractionEndpointStructure.md#eventpaths)
- [events](internal_.InteractionEndpointStructure.md#events)
- [initializeStructureFromEndpoints](internal_.InteractionEndpointStructure.md#initializestructurefromendpoints)
- [verifyAndInitializeStructureElementsFromEndpoint](internal_.InteractionEndpointStructure.md#verifyandinitializestructureelementsfromendpoint)

### Methods

- [clear](internal_.InteractionEndpointStructure.md#clear)
- [close](internal_.InteractionEndpointStructure.md#close)
- [getAttribute](internal_.InteractionEndpointStructure.md#getattribute)
- [getAttributes](internal_.InteractionEndpointStructure.md#getattributes)
- [getClusterServer](internal_.InteractionEndpointStructure.md#getclusterserver)
- [getCommand](internal_.InteractionEndpointStructure.md#getcommand)
- [getCommands](internal_.InteractionEndpointStructure.md#getcommands)
- [getEndpoint](internal_.InteractionEndpointStructure.md#getendpoint)
- [getEvent](internal_.InteractionEndpointStructure.md#getevent)
- [getEvents](internal_.InteractionEndpointStructure.md#getevents)
- [hasAttribute](internal_.InteractionEndpointStructure.md#hasattribute)
- [hasClusterServer](internal_.InteractionEndpointStructure.md#hasclusterserver)
- [hasCommand](internal_.InteractionEndpointStructure.md#hascommand)
- [hasEndpoint](internal_.InteractionEndpointStructure.md#hasendpoint)
- [hasEvent](internal_.InteractionEndpointStructure.md#hasevent)
- [initializeFromEndpoint](internal_.InteractionEndpointStructure.md#initializefromendpoint)
- [resolveAttributeName](internal_.InteractionEndpointStructure.md#resolveattributename)
- [resolveCommandName](internal_.InteractionEndpointStructure.md#resolvecommandname)
- [resolveEventName](internal_.InteractionEndpointStructure.md#resolveeventname)
- [resolveGenericElementName](internal_.InteractionEndpointStructure.md#resolvegenericelementname)
- [toHex](internal_.InteractionEndpointStructure.md#tohex)
- [validateConcreteAttributePath](internal_.InteractionEndpointStructure.md#validateconcreteattributepath)
- [validateConcreteCommandPath](internal_.InteractionEndpointStructure.md#validateconcretecommandpath)
- [validateConcreteEventPath](internal_.InteractionEndpointStructure.md#validateconcreteeventpath)

## Constructors

### constructor

• **new InteractionEndpointStructure**(): [`InteractionEndpointStructure`](internal_.InteractionEndpointStructure.md)

#### Returns

[`InteractionEndpointStructure`](internal_.InteractionEndpointStructure.md)

## Properties

### attributePaths

• **attributePaths**: [`AttributePath`](../interfaces/internal_.AttributePath.md)[]

#### Defined in

matter.js/dist/esm/protocol/interaction/InteractionEndpointStructure.d.ts:24

___

### attributes

• **attributes**: `Map`\<`string`, [`AnyAttributeServer`](../modules/internal_.md#anyattributeserver)\<`any`\>\>

#### Defined in

matter.js/dist/esm/protocol/interaction/InteractionEndpointStructure.d.ts:23

___

### change

• **change**: [`Observable`](../interfaces/internal_.Observable.md)\<`any`[], `void`\>

#### Defined in

matter.js/dist/esm/protocol/interaction/InteractionEndpointStructure.d.ts:29

___

### commandPaths

• **commandPaths**: [`CommandPath`](../interfaces/internal_.CommandPath.md)[]

#### Defined in

matter.js/dist/esm/protocol/interaction/InteractionEndpointStructure.d.ts:28

___

### commands

• **commands**: `Map`\<`string`, [`CommandServer`](internal_.CommandServer.md)\<`any`, `any`\>\>

#### Defined in

matter.js/dist/esm/protocol/interaction/InteractionEndpointStructure.d.ts:27

___

### endpoints

• **endpoints**: `Map`\<[`EndpointNumber`](../modules/internal_.md#endpointnumber), [`EndpointInterface`](../interfaces/internal_.EndpointInterface.md)\>

#### Defined in

matter.js/dist/esm/protocol/interaction/InteractionEndpointStructure.d.ts:22

___

### eventPaths

• **eventPaths**: [`EventPath`](../interfaces/internal_.EventPath.md)[]

#### Defined in

matter.js/dist/esm/protocol/interaction/InteractionEndpointStructure.d.ts:26

___

### events

• **events**: `Map`\<`string`, [`EventServer`](internal_.EventServer.md)\<`any`, `any`\>\>

#### Defined in

matter.js/dist/esm/protocol/interaction/InteractionEndpointStructure.d.ts:25

___

### initializeStructureFromEndpoints

• `Private` **initializeStructureFromEndpoints**: `any`

#### Defined in

matter.js/dist/esm/protocol/interaction/InteractionEndpointStructure.d.ts:33

___

### verifyAndInitializeStructureElementsFromEndpoint

• `Private` **verifyAndInitializeStructureElementsFromEndpoint**: `any`

#### Defined in

matter.js/dist/esm/protocol/interaction/InteractionEndpointStructure.d.ts:34

## Methods

### clear

▸ **clear**(): `void`

#### Returns

`void`

#### Defined in

matter.js/dist/esm/protocol/interaction/InteractionEndpointStructure.d.ts:30

___

### close

▸ **close**(): `void`

#### Returns

`void`

#### Defined in

matter.js/dist/esm/protocol/interaction/InteractionEndpointStructure.d.ts:31

___

### getAttribute

▸ **getAttribute**(`endpointId`, `clusterId`, `attributeId`): `undefined` \| [`AnyAttributeServer`](../modules/internal_.md#anyattributeserver)\<`any`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `endpointId` | [`EndpointNumber`](../modules/internal_.md#endpointnumber) |
| `clusterId` | [`ClusterId`](../modules/internal_.md#clusterid) |
| `attributeId` | [`AttributeId`](../modules/internal_.md#attributeid) |

#### Returns

`undefined` \| [`AnyAttributeServer`](../modules/internal_.md#anyattributeserver)\<`any`\>

#### Defined in

matter.js/dist/esm/protocol/interaction/InteractionEndpointStructure.d.ts:44

___

### getAttributes

▸ **getAttributes**(`filters`, `onlyWritable?`): [`AttributeWithPath`](../interfaces/internal_.AttributeWithPath.md)[]

#### Parameters

| Name | Type |
| :------ | :------ |
| `filters` | [`TypeFromFields`](../modules/internal_.md#typefromfields)\<\{ `attributeId`: [`OptionalFieldType`](../interfaces/internal_.OptionalFieldType.md)\<[`AttributeId`](../modules/internal_.md#attributeid)\> ; `clusterId`: [`OptionalFieldType`](../interfaces/internal_.OptionalFieldType.md)\<[`ClusterId`](../modules/internal_.md#clusterid)\<`number`\>\> ; `enableTagCompression`: [`OptionalFieldType`](../interfaces/internal_.OptionalFieldType.md)\<`boolean`\> ; `endpointId`: [`OptionalFieldType`](../interfaces/internal_.OptionalFieldType.md)\<[`EndpointNumber`](../modules/internal_.md#endpointnumber)\> ; `listIndex`: [`OptionalFieldType`](../interfaces/internal_.OptionalFieldType.md)\<``null`` \| `number`\> ; `nodeId`: [`OptionalFieldType`](../interfaces/internal_.OptionalFieldType.md)\<[`NodeId`](../modules/internal_.md#nodeid)\>  }\>[] |
| `onlyWritable?` | `boolean` |

#### Returns

[`AttributeWithPath`](../interfaces/internal_.AttributeWithPath.md)[]

#### Defined in

matter.js/dist/esm/protocol/interaction/InteractionEndpointStructure.d.ts:53

___

### getClusterServer

▸ **getClusterServer**(`endpointId`, `clusterId`): `undefined` \| [`ClusterServerObj`](../modules/internal_.md#clusterserverobj)\<`any`, `any`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `endpointId` | [`EndpointNumber`](../modules/internal_.md#endpointnumber) |
| `clusterId` | [`ClusterId`](../modules/internal_.md#clusterid) |

#### Returns

`undefined` \| [`ClusterServerObj`](../modules/internal_.md#clusterserverobj)\<`any`, `any`\>

#### Defined in

matter.js/dist/esm/protocol/interaction/InteractionEndpointStructure.d.ts:42

___

### getCommand

▸ **getCommand**(`endpointId`, `clusterId`, `commandId`): `undefined` \| [`CommandServer`](internal_.CommandServer.md)\<`any`, `any`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `endpointId` | [`EndpointNumber`](../modules/internal_.md#endpointnumber) |
| `clusterId` | [`ClusterId`](../modules/internal_.md#clusterid) |
| `commandId` | [`CommandId`](../modules/internal_.md#commandid) |

#### Returns

`undefined` \| [`CommandServer`](internal_.CommandServer.md)\<`any`, `any`\>

#### Defined in

matter.js/dist/esm/protocol/interaction/InteractionEndpointStructure.d.ts:50

___

### getCommands

▸ **getCommands**(`filters`): [`CommandWithPath`](../interfaces/internal_.CommandWithPath.md)[]

#### Parameters

| Name | Type |
| :------ | :------ |
| `filters` | [`TypeFromFields`](../modules/internal_.md#typefromfields)\<\{ `clusterId`: [`FieldType`](../interfaces/internal_.FieldType.md)\<[`ClusterId`](../modules/internal_.md#clusterid)\<`number`\>\> ; `commandId`: [`FieldType`](../interfaces/internal_.FieldType.md)\<[`CommandId`](../modules/internal_.md#commandid)\> ; `endpointId`: [`OptionalFieldType`](../interfaces/internal_.OptionalFieldType.md)\<[`EndpointNumber`](../modules/internal_.md#endpointnumber)\>  }\>[] |

#### Returns

[`CommandWithPath`](../interfaces/internal_.CommandWithPath.md)[]

#### Defined in

matter.js/dist/esm/protocol/interaction/InteractionEndpointStructure.d.ts:55

___

### getEndpoint

▸ **getEndpoint**(`endpointId`): `undefined` \| [`EndpointInterface`](../interfaces/internal_.EndpointInterface.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `endpointId` | [`EndpointNumber`](../modules/internal_.md#endpointnumber) |

#### Returns

`undefined` \| [`EndpointInterface`](../interfaces/internal_.EndpointInterface.md)

#### Defined in

matter.js/dist/esm/protocol/interaction/InteractionEndpointStructure.d.ts:40

___

### getEvent

▸ **getEvent**(`endpointId`, `clusterId`, `eventId`): `undefined` \| [`EventServer`](internal_.EventServer.md)\<`any`, `any`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `endpointId` | [`EndpointNumber`](../modules/internal_.md#endpointnumber) |
| `clusterId` | [`ClusterId`](../modules/internal_.md#clusterid) |
| `eventId` | [`EventId`](../modules/internal_.md#eventid) |

#### Returns

`undefined` \| [`EventServer`](internal_.EventServer.md)\<`any`, `any`\>

#### Defined in

matter.js/dist/esm/protocol/interaction/InteractionEndpointStructure.d.ts:47

___

### getEvents

▸ **getEvents**(`filters`): [`EventWithPath`](../interfaces/internal_.EventWithPath.md)[]

#### Parameters

| Name | Type |
| :------ | :------ |
| `filters` | [`TypeFromFields`](../modules/internal_.md#typefromfields)\<\{ `clusterId`: [`OptionalFieldType`](../interfaces/internal_.OptionalFieldType.md)\<[`ClusterId`](../modules/internal_.md#clusterid)\<`number`\>\> ; `endpointId`: [`OptionalFieldType`](../interfaces/internal_.OptionalFieldType.md)\<[`EndpointNumber`](../modules/internal_.md#endpointnumber)\> ; `eventId`: [`OptionalFieldType`](../interfaces/internal_.OptionalFieldType.md)\<[`EventId`](../modules/internal_.md#eventid)\> ; `isUrgent`: [`OptionalFieldType`](../interfaces/internal_.OptionalFieldType.md)\<`boolean`\> ; `nodeId`: [`OptionalFieldType`](../interfaces/internal_.OptionalFieldType.md)\<[`NodeId`](../modules/internal_.md#nodeid)\>  }\>[] |

#### Returns

[`EventWithPath`](../interfaces/internal_.EventWithPath.md)[]

#### Defined in

matter.js/dist/esm/protocol/interaction/InteractionEndpointStructure.d.ts:54

___

### hasAttribute

▸ **hasAttribute**(`endpointId`, `clusterId`, `attributeId`): `boolean`

#### Parameters

| Name | Type |
| :------ | :------ |
| `endpointId` | [`EndpointNumber`](../modules/internal_.md#endpointnumber) |
| `clusterId` | [`ClusterId`](../modules/internal_.md#clusterid) |
| `attributeId` | [`AttributeId`](../modules/internal_.md#attributeid) |

#### Returns

`boolean`

#### Defined in

matter.js/dist/esm/protocol/interaction/InteractionEndpointStructure.d.ts:45

___

### hasClusterServer

▸ **hasClusterServer**(`endpointId`, `clusterId`): `boolean`

#### Parameters

| Name | Type |
| :------ | :------ |
| `endpointId` | [`EndpointNumber`](../modules/internal_.md#endpointnumber) |
| `clusterId` | [`ClusterId`](../modules/internal_.md#clusterid) |

#### Returns

`boolean`

#### Defined in

matter.js/dist/esm/protocol/interaction/InteractionEndpointStructure.d.ts:43

___

### hasCommand

▸ **hasCommand**(`endpointId`, `clusterId`, `commandId`): `boolean`

#### Parameters

| Name | Type |
| :------ | :------ |
| `endpointId` | [`EndpointNumber`](../modules/internal_.md#endpointnumber) |
| `clusterId` | [`ClusterId`](../modules/internal_.md#clusterid) |
| `commandId` | [`CommandId`](../modules/internal_.md#commandid) |

#### Returns

`boolean`

#### Defined in

matter.js/dist/esm/protocol/interaction/InteractionEndpointStructure.d.ts:51

___

### hasEndpoint

▸ **hasEndpoint**(`endpointId`): `boolean`

#### Parameters

| Name | Type |
| :------ | :------ |
| `endpointId` | [`EndpointNumber`](../modules/internal_.md#endpointnumber) |

#### Returns

`boolean`

#### Defined in

matter.js/dist/esm/protocol/interaction/InteractionEndpointStructure.d.ts:41

___

### hasEvent

▸ **hasEvent**(`endpointId`, `clusterId`, `eventId`): `boolean`

#### Parameters

| Name | Type |
| :------ | :------ |
| `endpointId` | [`EndpointNumber`](../modules/internal_.md#endpointnumber) |
| `clusterId` | [`ClusterId`](../modules/internal_.md#clusterid) |
| `eventId` | [`EventId`](../modules/internal_.md#eventid) |

#### Returns

`boolean`

#### Defined in

matter.js/dist/esm/protocol/interaction/InteractionEndpointStructure.d.ts:48

___

### initializeFromEndpoint

▸ **initializeFromEndpoint**(`endpoint`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `endpoint` | [`EndpointInterface`](../interfaces/internal_.EndpointInterface.md) |

#### Returns

`void`

#### Defined in

matter.js/dist/esm/protocol/interaction/InteractionEndpointStructure.d.ts:32

___

### resolveAttributeName

▸ **resolveAttributeName**(`«destructured»`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | [`TypeFromFields`](../modules/internal_.md#typefromfields)\<\{ `attributeId`: [`OptionalFieldType`](../interfaces/internal_.OptionalFieldType.md)\<[`AttributeId`](../modules/internal_.md#attributeid)\> ; `clusterId`: [`OptionalFieldType`](../interfaces/internal_.OptionalFieldType.md)\<[`ClusterId`](../modules/internal_.md#clusterid)\<`number`\>\> ; `enableTagCompression`: [`OptionalFieldType`](../interfaces/internal_.OptionalFieldType.md)\<`boolean`\> ; `endpointId`: [`OptionalFieldType`](../interfaces/internal_.OptionalFieldType.md)\<[`EndpointNumber`](../modules/internal_.md#endpointnumber)\> ; `listIndex`: [`OptionalFieldType`](../interfaces/internal_.OptionalFieldType.md)\<``null`` \| `number`\> ; `nodeId`: [`OptionalFieldType`](../interfaces/internal_.OptionalFieldType.md)\<[`NodeId`](../modules/internal_.md#nodeid)\>  }\> |

#### Returns

`string`

#### Defined in

matter.js/dist/esm/protocol/interaction/InteractionEndpointStructure.d.ts:37

___

### resolveCommandName

▸ **resolveCommandName**(`«destructured»`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | [`TypeFromFields`](../modules/internal_.md#typefromfields)\<\{ `clusterId`: [`FieldType`](../interfaces/internal_.FieldType.md)\<[`ClusterId`](../modules/internal_.md#clusterid)\<`number`\>\> ; `commandId`: [`FieldType`](../interfaces/internal_.FieldType.md)\<[`CommandId`](../modules/internal_.md#commandid)\> ; `endpointId`: [`OptionalFieldType`](../interfaces/internal_.OptionalFieldType.md)\<[`EndpointNumber`](../modules/internal_.md#endpointnumber)\>  }\> |

#### Returns

`string`

#### Defined in

matter.js/dist/esm/protocol/interaction/InteractionEndpointStructure.d.ts:39

___

### resolveEventName

▸ **resolveEventName**(`«destructured»`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | [`TypeFromFields`](../modules/internal_.md#typefromfields)\<\{ `clusterId`: [`OptionalFieldType`](../interfaces/internal_.OptionalFieldType.md)\<[`ClusterId`](../modules/internal_.md#clusterid)\<`number`\>\> ; `endpointId`: [`OptionalFieldType`](../interfaces/internal_.OptionalFieldType.md)\<[`EndpointNumber`](../modules/internal_.md#endpointnumber)\> ; `eventId`: [`OptionalFieldType`](../interfaces/internal_.OptionalFieldType.md)\<[`EventId`](../modules/internal_.md#eventid)\> ; `isUrgent`: [`OptionalFieldType`](../interfaces/internal_.OptionalFieldType.md)\<`boolean`\> ; `nodeId`: [`OptionalFieldType`](../interfaces/internal_.OptionalFieldType.md)\<[`NodeId`](../modules/internal_.md#nodeid)\>  }\> |

#### Returns

`string`

#### Defined in

matter.js/dist/esm/protocol/interaction/InteractionEndpointStructure.d.ts:38

___

### resolveGenericElementName

▸ **resolveGenericElementName**(`nodeId`, `endpointId`, `clusterId`, `elementId`, `elementMap`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `nodeId` | `undefined` \| [`NodeId`](../modules/internal_.md#nodeid) |
| `endpointId` | `undefined` \| [`EndpointNumber`](../modules/internal_.md#endpointnumber) |
| `clusterId` | `undefined` \| [`ClusterId`](../modules/internal_.md#clusterid) |
| `elementId` | `undefined` \| `number` |
| `elementMap` | `Map`\<`string`, `any`\> |

#### Returns

`string`

#### Defined in

matter.js/dist/esm/protocol/interaction/InteractionEndpointStructure.d.ts:36

___

### toHex

▸ **toHex**(`value`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `value` | `undefined` \| `number` \| `bigint` |

#### Returns

`string`

#### Defined in

matter.js/dist/esm/protocol/interaction/InteractionEndpointStructure.d.ts:35

___

### validateConcreteAttributePath

▸ **validateConcreteAttributePath**(`endpointId`, `clusterId`, `attributeId`): `boolean`

#### Parameters

| Name | Type |
| :------ | :------ |
| `endpointId` | [`EndpointNumber`](../modules/internal_.md#endpointnumber) |
| `clusterId` | [`ClusterId`](../modules/internal_.md#clusterid) |
| `attributeId` | [`AttributeId`](../modules/internal_.md#attributeid) |

#### Returns

`boolean`

#### Defined in

matter.js/dist/esm/protocol/interaction/InteractionEndpointStructure.d.ts:46

___

### validateConcreteCommandPath

▸ **validateConcreteCommandPath**(`endpointId`, `clusterId`, `commandId`): `boolean`

#### Parameters

| Name | Type |
| :------ | :------ |
| `endpointId` | [`EndpointNumber`](../modules/internal_.md#endpointnumber) |
| `clusterId` | [`ClusterId`](../modules/internal_.md#clusterid) |
| `commandId` | [`CommandId`](../modules/internal_.md#commandid) |

#### Returns

`boolean`

#### Defined in

matter.js/dist/esm/protocol/interaction/InteractionEndpointStructure.d.ts:52

___

### validateConcreteEventPath

▸ **validateConcreteEventPath**(`endpointId`, `clusterId`, `eventId`): `boolean`

#### Parameters

| Name | Type |
| :------ | :------ |
| `endpointId` | [`EndpointNumber`](../modules/internal_.md#endpointnumber) |
| `clusterId` | [`ClusterId`](../modules/internal_.md#clusterid) |
| `eventId` | [`EventId`](../modules/internal_.md#eventid) |

#### Returns

`boolean`

#### Defined in

matter.js/dist/esm/protocol/interaction/InteractionEndpointStructure.d.ts:49
