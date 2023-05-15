import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { InfrastructureStack } from "./infrastructure-stack";
import { InstanceClass, InstanceSize, InstanceType } from "aws-cdk-lib/aws-ec2";
import { AuroraCapacityUnit } from "aws-cdk-lib/aws-rds";
import { Duration } from "aws-cdk-lib";

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
    elsa_database: {
      type: "postgres-instance",
      instanceType: InstanceType.of(
        InstanceClass.BURSTABLE4_GRAVITON,
        InstanceSize.SMALL
      ),
      adminUser: `elsa_admin`,
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
      "pg-elsa-data": {
        type: "postgres-instance",
        instanceType: InstanceType.of(
          InstanceClass.BURSTABLE4_GRAVITON,
          InstanceSize.MEDIUM
        ),
        adminUser: "elsa_admin",
        enableMonitoring: {
          cloudwatchLogsExports: ["postgresql"],
          enablePerformanceInsights: true,
          monitoringInterval: Duration.seconds(60),
        },
      },
      "pg-serverless-elsa-data": {
        type: "postgres-serverless-2",
        minCapacity: 0.5,
        maxCapacity: AuroraCapacityUnit.ACU_2,
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

new InfrastructureStack(
  app,
  "ElsaDataServerlessLocalDevTestInfrastructureStack",
  {
    // the pipeline can only be deployed to UMCCR 'dev'
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
      name: "elsa-data-serverless",
    },
    dns: {
      hostedZoneName: "dev.umccr.org",
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
    secretsPrefix: "ElsaDataServerless", // pragma: allowlist secret
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
