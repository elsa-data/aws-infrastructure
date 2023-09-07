import { InfrastructureClient } from "elsa-data-aws-infrastructure-client";

import * as cdk from "aws-cdk-lib";
import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";

const app = new cdk.App();

class TestConstruct extends Construct {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    const client = new InfrastructureClient("ElsaDataDevInfrastructureStack");

    const vpc = client.getVpcFromLookup(this);

    const ns = client.getDnsFromLookup(this);
  }
}

class TestStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);

    new TestConstruct(this, "Con");
  }
}

new TestStack(app, "Stack", {
  env: {
    account: "843407916570",
    region: "ap-southeast-2",
  },
});
