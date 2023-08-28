import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { Aspects, Duration } from "aws-cdk-lib";
import { InfrastructureStack } from "elsa-data-aws-infrastructure";
import { AwsSolutionsChecks, HIPAASecurityChecks } from "cdk-nag";

const app = new cdk.App();

Aspects.of(app).add(new AwsSolutionsChecks({ verbose: true }));
Aspects.of(app).add(new HIPAASecurityChecks({ verbose: true }));

// tags for our stacks
const tags = {
  "umccr-org:Stack": "ElsaDataInfrastructure",
  "umccr-org:Product": "ElsaData",
};

const description =
  "Infrastructure for Elsa Data - an application for controlled genomic data sharing";

/**
 * Development friendly for dev accounts
 */
new InfrastructureStack(app, "ElsaDataDevInfrastructureStack", {
  // deploy this infrastructure to dev
  env: {
    account: "843407916570",
    region: "ap-southeast-2",
  },
  tags: tags,
  isDevelopment: true,
  description: description,
  network: {
    // use the dev VPC that already exists
    vpcNameOrDefaultOrUndefined: "main-vpc",
  },
  ns: {
    name: "elsa-data",
  },
  dns: {
    hostedZoneName: "dev.umccr.org",
  },
  databases: [
    {
      postgresType: "postgres-serverless-2",
      name: "elsa_data_serverless_database",
      adminUser: "elsa_admin",
      enableMonitoring: {
        cloudwatchLogsExports: ["postgresql"],
        enablePerformanceInsights: true,
        monitoringInterval: Duration.seconds(60),
      },
      makePubliclyReachable: false,
      destroyOnRemove: true,
      edgeDb: {
        version: "3.2",
        makePubliclyReachable: {
          urlPrefix: "elsa-data-edge-db",
        },
      },
    },
  ],
  secretsPrefix: "ElsaDataDev", // pragma: allowlist secret
});
