import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { InfrastructureStack } from "./infrastructure-stack";
import { InstanceClass, InstanceSize, InstanceType } from "aws-cdk-lib/aws-ec2";
import {Duration} from "aws-cdk-lib";

const app = new cdk.App();

// tags for our stacks
const tags = {
  "umccr-org:Stack": "ElsaDataInfrastructure",
  "umccr-org:Product": "ElsaData",
};

// the CloudMap namespace to create associated with this VPC
const ns = "elsa-data";

const description =
  "Infrastructure for Elsa Data - an application for controlled genomic data sharing";

new InfrastructureStack(app, "ElsaDataLocalDevTestInfrastructureStack", {
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
    name: ns,
  },
  dns: {
    hostedZoneName: "dev.umccr.org",
  },
  database: {
    instanceType: InstanceType.of(
      InstanceClass.BURSTABLE4_GRAVITON,
      InstanceSize.SMALL
    ),
    dbAdminUser: `elsa_admin`,
    dbName: `elsa_database`,
    enableMonitoring: {
      cloudwatchLogsExports: ["postgresql"],
      enablePerformanceInsights: true,
      monitoringInterval: Duration.seconds(60),
    }
  },
  secretsPrefix: "ElsaData", // pragma: allowlist secret
});

// new InfrastructureStack(app, "ElsaDataAustralianGenomicsInfrastructureStack", {
//   // the pipeline can only be deployed to 'ag'
//   env: {
//     account: "602836945884",
//     region: "ap-southeast-2",
//   },
//   tags: tags,
//   isDevelopment: false,
//   description: description,
//   network: {
//     // we want it to construct a new custom VPC to limit possible breach surface
//     vpcNameOrDefaultOrNull: null,
//   },
//   namespace: {
//     name: ns,
//   },
//   dns: {
//     hostedZoneName: "agha.umccr.org",
//   },
//   database: {
//     instanceType: InstanceType.of(
//       InstanceClass.BURSTABLE4_GRAVITON,
//       InstanceSize.SMALL
//     ),
//     dbAdminUser: `elsa_admin`,
//     dbName: `elsa_database`,
//   },
//   secretsPrefix: "ElsaData", // pragma: allowlist secret
// });
