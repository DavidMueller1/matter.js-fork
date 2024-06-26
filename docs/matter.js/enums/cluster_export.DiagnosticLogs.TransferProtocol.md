[@project-chip/matter.js](../README.md) / [Modules](../modules.md) / [cluster/export](../modules/cluster_export.md) / [DiagnosticLogs](../modules/cluster_export.DiagnosticLogs.md) / TransferProtocol

# Enumeration: TransferProtocol

[cluster/export](../modules/cluster_export.md).[DiagnosticLogs](../modules/cluster_export.DiagnosticLogs.md).TransferProtocol

**`See`**

MatterSpecification.v11.Core § 11.10.4.3

## Table of contents

### Enumeration Members

- [Bdx](cluster_export.DiagnosticLogs.TransferProtocol.md#bdx)
- [ResponsePayload](cluster_export.DiagnosticLogs.TransferProtocol.md#responsepayload)

## Enumeration Members

### Bdx

• **Bdx** = ``1``

Logs to be returned using BDX

shall be used by a Client to request that logs are transferred using BDX as defined in BDX Protocol

**`See`**

MatterSpecification.v11.Core § 11.10.4.3.2

#### Defined in

[packages/matter.js/src/cluster/definitions/DiagnosticLogsCluster.ts:74](https://github.com/project-chip/matter.js/blob/c0d55745d5279e16fdfaa7d2c564daa31e19c627/packages/matter.js/src/cluster/definitions/DiagnosticLogsCluster.ts#L74)

___

### ResponsePayload

• **ResponsePayload** = ``0``

Logs to be returned as a response

shall be used by a Client to request that logs are transferred using the LogContent attribute of the response

**`See`**

MatterSpecification.v11.Core § 11.10.4.3.1

#### Defined in

[packages/matter.js/src/cluster/definitions/DiagnosticLogsCluster.ts:65](https://github.com/project-chip/matter.js/blob/c0d55745d5279e16fdfaa7d2c564daa31e19c627/packages/matter.js/src/cluster/definitions/DiagnosticLogsCluster.ts#L65)
