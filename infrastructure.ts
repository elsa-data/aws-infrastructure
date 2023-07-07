import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { Duration } from "aws-cdk-lib";
import { InfrastructureStack } from "./infrastructure-stack";

const app = new cdk.App();

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
    vpcNameOrDefaultOrNull: "main-vpc",
  },
  namespace: {
    name: "elsa-data",
  },
  dns: {
    hostedZoneName: "dev.umccr.org",
  },
  databases: {
    elsa_data_serverless_database: {
      type: "postgres-serverless-2",
      adminUser: "elsa_admin",
      enableMonitoring: {
        cloudwatchLogsExports: ["postgresql"],
        enablePerformanceInsights: true,
        monitoringInterval: Duration.seconds(60),
      },
      makePubliclyReachable: false,
      destroyOnRemove: true,
      edgeDb: {
        version: "3.0",
        makePubliclyReachable: {
          urlPrefix: "elsa-data-edge-db",
          enableUi: {},
        },
      },
    },
  },
  secretsPrefix: "ElsaDataDev", // pragma: allowlist secret
});

/**
 * For demonstration of Elsa for Australian Genomics
 */
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
      name: "elsa-data-demo",
    },
    dns: {
      hostedZoneName: "agha.umccr.org",
    },
    databases: {
      elsa_data_serverless_database: {
        type: "postgres-serverless-2",
        adminUser: "elsa_data_serverless_admin",
        enableMonitoring: {
          cloudwatchLogsExports: ["postgresql"],
          enablePerformanceInsights: true,
          monitoringInterval: Duration.seconds(60),
        },
        makePubliclyReachable: false,
        destroyOnRemove: true,
        edgeDb: {
          version: "3.0",
          // for resetting/setup of the demo instance it is useful for the EdgeDb to be accessible
          makePubliclyReachable: {
            urlPrefix: "elsa-data-demo-edge-db",
            enableUi: {},
          },
        },
      },
    },
    secretsPrefix: "ElsaDataDemo", // pragma: allowlist secret
  }
);

/**
 * For production Elsa for Australian Genomics
 * - currently no database - as we only spin this up to occasionally
 *   do a manual copy out
 */
new InfrastructureStack(
  app,
  "ElsaDataProdAustralianGenomicsInfrastructureStack",
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
      name: "elsa-data-prod",
    },
    dns: {
      hostedZoneName: "agha.umccr.org",
    },
    secretsPrefix: "ElsaDataProd", // pragma: allowlist secret
  }
);
