# CDK Infrastructure for Elsa Data

The client package for a CDK infrastructure stack.

```typescript
const infraClient = new ElsaDataInfrastructureClient("MyInfrastructureStack");

const vpc = infraClient.getVpcFromLookup(this);

const namespace = infraClient.getNamespaceFromLookup(this);
```
