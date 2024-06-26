[@project-chip/matter.js](../README.md) / [Modules](../modules.md) / [cluster/export](../modules/cluster_export.md) / [FanControl](../modules/cluster_export.FanControl.md) / FanMode

# Enumeration: FanMode

[cluster/export](../modules/cluster_export.md).[FanControl](../modules/cluster_export.FanControl.md).FanMode

The value of the FanControl fanMode attribute

**`See`**

MatterSpecification.v11.Cluster § 4.4.6.1

## Table of contents

### Enumeration Members

- [Auto](cluster_export.FanControl.FanMode.md#auto)
- [High](cluster_export.FanControl.FanMode.md#high)
- [Low](cluster_export.FanControl.FanMode.md#low)
- [Medium](cluster_export.FanControl.FanMode.md#medium)
- [Off](cluster_export.FanControl.FanMode.md#off)
- [On](cluster_export.FanControl.FanMode.md#on)
- [Smart](cluster_export.FanControl.FanMode.md#smart)

## Enumeration Members

### Auto

• **Auto** = ``5``

Setting the attribute value to Auto shall set the values of these attributes to null:

  • PercentSetting

  • SpeedSetting (if present)

These attributes shall indicate the current state of the fan while this attribute value is Auto:

  • PercentCurrent

  • SpeedCurrent (if present)

**`See`**

MatterSpecification.v11.Cluster § 4.4.6.1.3

#### Defined in

[packages/matter.js/src/cluster/definitions/FanControlCluster.ts:113](https://github.com/project-chip/matter.js/blob/c0d55745d5279e16fdfaa7d2c564daa31e19c627/packages/matter.js/src/cluster/definitions/FanControlCluster.ts#L113)

___

### High

• **High** = ``3``

#### Defined in

[packages/matter.js/src/cluster/definitions/FanControlCluster.ts:95](https://github.com/project-chip/matter.js/blob/c0d55745d5279e16fdfaa7d2c564daa31e19c627/packages/matter.js/src/cluster/definitions/FanControlCluster.ts#L95)

___

### Low

• **Low** = ``1``

#### Defined in

[packages/matter.js/src/cluster/definitions/FanControlCluster.ts:93](https://github.com/project-chip/matter.js/blob/c0d55745d5279e16fdfaa7d2c564daa31e19c627/packages/matter.js/src/cluster/definitions/FanControlCluster.ts#L93)

___

### Medium

• **Medium** = ``2``

#### Defined in

[packages/matter.js/src/cluster/definitions/FanControlCluster.ts:94](https://github.com/project-chip/matter.js/blob/c0d55745d5279e16fdfaa7d2c564daa31e19c627/packages/matter.js/src/cluster/definitions/FanControlCluster.ts#L94)

___

### Off

• **Off** = ``0``

Setting the attribute value to Off shall set the values of these attributes to 0 (zero):

  • PercentSetting

  • PercentCurrent

  • SpeedSetting (if present)

  • SpeedCurrent (if present)

4.4.6.1.2. Low, Medium, High or Unsupported

If the fan only supports 1 speed then:

  • only the High attribute value shall be supported

  • SpeedMax attribute, if present, shall be 1

If the fan only supports 2 speeds then only the Low and High attribute values shall be supported.

If a client attempts to write an unsupported value (such as On), the FanMode attribute shall be set to High.

If the value is High, Medium, or Low the server shall set these percent speed attributes to a single value
in the corresponding range as defined in the percent rules:

  • PercentSetting

  • PercentCurrent

If the value is High, Medium, or Low the server shall set these speed attributes to a single value in the
corresponding range as defined in Speed Rules>:

  • SpeedSetting (if present)

  • SpeedCurrent (if present)

**`See`**

MatterSpecification.v11.Cluster § 4.4.6.1.1

#### Defined in

[packages/matter.js/src/cluster/definitions/FanControlCluster.ts:91](https://github.com/project-chip/matter.js/blob/c0d55745d5279e16fdfaa7d2c564daa31e19c627/packages/matter.js/src/cluster/definitions/FanControlCluster.ts#L91)

___

### On

• **On** = ``4``

#### Defined in

[packages/matter.js/src/cluster/definitions/FanControlCluster.ts:96](https://github.com/project-chip/matter.js/blob/c0d55745d5279e16fdfaa7d2c564daa31e19c627/packages/matter.js/src/cluster/definitions/FanControlCluster.ts#L96)

___

### Smart

• **Smart** = ``6``

#### Defined in

[packages/matter.js/src/cluster/definitions/FanControlCluster.ts:115](https://github.com/project-chip/matter.js/blob/c0d55745d5279e16fdfaa7d2c564daa31e19c627/packages/matter.js/src/cluster/definitions/FanControlCluster.ts#L115)
