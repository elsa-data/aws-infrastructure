import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { Duration } from "aws-cdk-lib";
import { InfrastructureStack } from "./infrastructure-stack";
import { AuroraCapacityUnit } from "aws-cdk-lib/aws-rds";

const app = new cdk.App();

// tags for our stacks
const tags = {
  "umccr-org:Stack": "ElsaDataInfrastructure",
  "umccr-org:Product": "ElsaData",
};

const description =
  "Infrastructure for Elsa Data - an application for controlled genomic data sharing";

new InfrastructureStack(app, "ElsaDataLocalDevTestInfrastructureStack", {
  // deploy this infrastructure to dev
  env: {
    account: "843407916570",
    region: "ap-southeast-2",
  },
  tags: tags,
  isDevelopment: true,
  forceDeployment: true,
  description: description,
  network: {
    // use the dev VPC that already exists
    vpcNameOrDefaultOrNull: "main-vpc",
  },
  namespace: {
    name: "elsa-data",
  },
  dns: {
    hostedZoneName: "dev.umccr.org",
  },
  databases: {
    elsa_serverless_database: {
      type: "postgres-serverless-2",
      adminUser: "elsa_admin",
      minCapacity: 0.5,
      maxCapacity: 4,
      enableMonitoring: {
        cloudwatchLogsExports: ["postgresql"],
        enablePerformanceInsights: true,
        monitoringInterval: Duration.seconds(60),
      },
      edgeDb: {
        version: "3.0-beta.1",
        memoryLimitMiB: 2048,
        cpu: 1024,
      },
    },
  },
  secretsPrefix: "ElsaData", // pragma: allowlist secret
});

new InfrastructureStack(
  app,
  "ElsaDataDemoAustralianGenomicsInfrastructureStack",
  {
    // deploy this infrastructure to ag
    env: {
      account: "602836945884",
      region: "ap-southeast-2",
    },
    tags: tags,
    isDevelopment: false,
    description: description,
    network: {
      // we want it to construct a new custom VPC to limit possible breach surface
      vpcNameOrDefaultOrNull: null,
    },
    namespace: {
      name: "elsa-data",
    },
    dns: {
      hostedZoneName: "agha.umccr.org",
    },
    databases: {
      "pg-serverless-elsa-data": {
        type: "postgres-serverless-2",
        minCapacity: 0.5,
        maxCapacity: AuroraCapacityUnit.ACU_4,
        adminUser: "elsa_admin",
        enableMonitoring: {
          cloudwatchLogsExports: ["postgresql"],
          enablePerformanceInsights: true,
          monitoringInterval: Duration.seconds(60),
        },
      },
    },
    secretsPrefix: "ElsaDataDemo", // pragma: allowlist secret
  }
);

new InfrastructureStack(app, "ElsaDataAustralianGenomicsInfrastructureStack", {
  // the pipeline can only be deployed to 'ag'
  env: {
    account: "602836945884",
    region: "ap-southeast-2",
  },
  tags: tags,
  isDevelopment: false,
  description: description,
  network: {
    // we want it to construct a new custom VPC to limit possible breach surface
    vpcNameOrDefaultOrNull: null,
  },
  namespace: {
    name: "elsa-data-prod",
  },
  dns: {
    hostedZoneName: "agha.umccr.org",
  },
  databases: {
    elsa_database: {
      type: "postgres-serverless-2",
      adminUser: `elsa_admin`,
      minCapacity: 0.5,
      maxCapacity: 4,
      enableMonitoring: {
        cloudwatchLogsExports: ["postgresql"],
        enablePerformanceInsights: true,
        monitoringInterval: Duration.seconds(60),
      },
    },
  },
  secretsPrefix: "ElsaData", // pragma: allowlist secret
});
