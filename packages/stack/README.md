# CDK Infrastructure for Elsa Data

An infrastructure stack that forms the long term basis for any
Elsa Data application deployments. That is, this stack installs
any long term infrastructure such as databases and certificates, that
otherwise would cause application stack deploy/undeploy to take
significant periods of time.

## Use

The infrastructure stack resources can be accessed in another CDK stack
through the use of the `@elsa-data/aws-infrastructure-client` project (and the
infrastructure stack name) - which
provides SSM parameters containing values from the infrastructure.

For example,

```typescript
const infraClient = new ElsaDataInfrastructureClient("MyInfrastructureStack");

const vpc = infraClient.getVpcFromLookup(this);

const namespace = infraClient.getNamespaceFromLookup(this);
```

## Included

Infrastructure includes

- an optional VPC (or the ability to re-use an existing VPC by name)
- RDS Postgres (instance or serverless)
- a S3 bucket for temp objects
- a SSL wildcard certificate with connected DNS zone (re-using an existing one)
- an EdgeDb instance on top of Postgres
