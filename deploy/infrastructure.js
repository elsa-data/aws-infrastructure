"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("source-map-support/register");
const cdk = require("aws-cdk-lib");
const aws_cdk_lib_1 = require("aws-cdk-lib");
const infrastructure_stack_1 = require("./infrastructure-stack");
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
new infrastructure_stack_1.InfrastructureStack(
  app,
  "ElsaDataDevInfrastructureStack",
  {
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
          monitoringInterval: aws_cdk_lib_1.Duration.seconds(60),
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
  }
);
/**
 * For demonstration of Elsa for Australian Genomics
 */
new infrastructure_stack_1.InfrastructureStack(
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
          monitoringInterval: aws_cdk_lib_1.Duration.seconds(60),
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
new infrastructure_stack_1.InfrastructureStack(
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5mcmFzdHJ1Y3R1cmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmZyYXN0cnVjdHVyZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLHVDQUFxQztBQUNyQyxtQ0FBbUM7QUFDbkMsNkNBQXVDO0FBQ3ZDLGlFQUE2RDtBQUU3RCxNQUFNLEdBQUcsR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQztBQUUxQixzQkFBc0I7QUFDdEIsTUFBTSxJQUFJLEdBQUc7SUFDWCxpQkFBaUIsRUFBRSx3QkFBd0I7SUFDM0MsbUJBQW1CLEVBQUUsVUFBVTtDQUNoQyxDQUFDO0FBRUYsTUFBTSxXQUFXLEdBQ2YsbUZBQW1GLENBQUM7QUFFdEY7O0dBRUc7QUFDSCxJQUFJLDBDQUFtQixDQUFDLEdBQUcsRUFBRSxnQ0FBZ0MsRUFBRTtJQUM3RCxvQ0FBb0M7SUFDcEMsR0FBRyxFQUFFO1FBQ0gsT0FBTyxFQUFFLGNBQWM7UUFDdkIsTUFBTSxFQUFFLGdCQUFnQjtLQUN6QjtJQUNELElBQUksRUFBRSxJQUFJO0lBQ1YsYUFBYSxFQUFFLElBQUk7SUFDbkIsV0FBVyxFQUFFLFdBQVc7SUFDeEIsT0FBTyxFQUFFO1FBQ1Asc0NBQXNDO1FBQ3RDLHNCQUFzQixFQUFFLFVBQVU7S0FDbkM7SUFDRCxTQUFTLEVBQUU7UUFDVCxJQUFJLEVBQUUsV0FBVztLQUNsQjtJQUNELEdBQUcsRUFBRTtRQUNILGNBQWMsRUFBRSxlQUFlO0tBQ2hDO0lBQ0QsU0FBUyxFQUFFO1FBQ1QsNkJBQTZCLEVBQUU7WUFDN0IsSUFBSSxFQUFFLHVCQUF1QjtZQUM3QixTQUFTLEVBQUUsWUFBWTtZQUN2QixnQkFBZ0IsRUFBRTtnQkFDaEIscUJBQXFCLEVBQUUsQ0FBQyxZQUFZLENBQUM7Z0JBQ3JDLHlCQUF5QixFQUFFLElBQUk7Z0JBQy9CLGtCQUFrQixFQUFFLHNCQUFRLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQzthQUN6QztZQUNELHFCQUFxQixFQUFFLEtBQUs7WUFDNUIsZUFBZSxFQUFFLElBQUk7WUFDckIsTUFBTSxFQUFFO2dCQUNOLE9BQU8sRUFBRSxLQUFLO2dCQUNkLHFCQUFxQixFQUFFO29CQUNyQixTQUFTLEVBQUUsbUJBQW1CO29CQUM5QixRQUFRLEVBQUUsRUFBRTtpQkFDYjthQUNGO1NBQ0Y7S0FDRjtJQUNELGFBQWEsRUFBRSxhQUFhLEVBQUUsMkJBQTJCO0NBQzFELENBQUMsQ0FBQztBQUVIOztHQUVHO0FBQ0gsSUFBSSwwQ0FBbUIsQ0FDckIsR0FBRyxFQUNILG1EQUFtRCxFQUNuRDtJQUNFLG1DQUFtQztJQUNuQyxHQUFHLEVBQUU7UUFDSCxPQUFPLEVBQUUsY0FBYztRQUN2QixNQUFNLEVBQUUsZ0JBQWdCO0tBQ3pCO0lBQ0QsSUFBSSxFQUFFLElBQUk7SUFDVixhQUFhLEVBQUUsS0FBSztJQUNwQixXQUFXLEVBQUUsV0FBVztJQUN4QixPQUFPLEVBQUU7UUFDUCw0RUFBNEU7UUFDNUUsc0JBQXNCLEVBQUUsSUFBSTtLQUM3QjtJQUNELFNBQVMsRUFBRTtRQUNULElBQUksRUFBRSxnQkFBZ0I7S0FDdkI7SUFDRCxHQUFHLEVBQUU7UUFDSCxjQUFjLEVBQUUsZ0JBQWdCO0tBQ2pDO0lBQ0QsU0FBUyxFQUFFO1FBQ1QsNkJBQTZCLEVBQUU7WUFDN0IsSUFBSSxFQUFFLHVCQUF1QjtZQUM3QixTQUFTLEVBQUUsNEJBQTRCO1lBQ3ZDLGdCQUFnQixFQUFFO2dCQUNoQixxQkFBcUIsRUFBRSxDQUFDLFlBQVksQ0FBQztnQkFDckMseUJBQXlCLEVBQUUsSUFBSTtnQkFDL0Isa0JBQWtCLEVBQUUsc0JBQVEsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDO2FBQ3pDO1lBQ0QscUJBQXFCLEVBQUUsS0FBSztZQUM1QixlQUFlLEVBQUUsSUFBSTtZQUNyQixNQUFNLEVBQUU7Z0JBQ04sT0FBTyxFQUFFLEtBQUs7Z0JBQ2Qsd0ZBQXdGO2dCQUN4RixxQkFBcUIsRUFBRTtvQkFDckIsU0FBUyxFQUFFLHdCQUF3QjtvQkFDbkMsUUFBUSxFQUFFLEVBQUU7aUJBQ2I7YUFDRjtTQUNGO0tBQ0Y7SUFDRCxhQUFhLEVBQUUsY0FBYyxFQUFFLDJCQUEyQjtDQUMzRCxDQUNGLENBQUM7QUFFRjs7OztHQUlHO0FBQ0gsSUFBSSwwQ0FBbUIsQ0FDckIsR0FBRyxFQUNILG1EQUFtRCxFQUNuRDtJQUNFLG1DQUFtQztJQUNuQyxHQUFHLEVBQUU7UUFDSCxPQUFPLEVBQUUsY0FBYztRQUN2QixNQUFNLEVBQUUsZ0JBQWdCO0tBQ3pCO0lBQ0QsSUFBSSxFQUFFLElBQUk7SUFDVixhQUFhLEVBQUUsS0FBSztJQUNwQixXQUFXLEVBQUUsV0FBVztJQUN4QixPQUFPLEVBQUU7UUFDUCw0RUFBNEU7UUFDNUUsc0JBQXNCLEVBQUUsSUFBSTtLQUM3QjtJQUNELFNBQVMsRUFBRTtRQUNULElBQUksRUFBRSxnQkFBZ0I7S0FDdkI7SUFDRCxHQUFHLEVBQUU7UUFDSCxjQUFjLEVBQUUsZ0JBQWdCO0tBQ2pDO0lBQ0QsYUFBYSxFQUFFLGNBQWMsRUFBRSwyQkFBMkI7Q0FDM0QsQ0FDRixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFwic291cmNlLW1hcC1zdXBwb3J0L3JlZ2lzdGVyXCI7XG5pbXBvcnQgKiBhcyBjZGsgZnJvbSBcImF3cy1jZGstbGliXCI7XG5pbXBvcnQgeyBEdXJhdGlvbiB9IGZyb20gXCJhd3MtY2RrLWxpYlwiO1xuaW1wb3J0IHsgSW5mcmFzdHJ1Y3R1cmVTdGFjayB9IGZyb20gXCIuL2luZnJhc3RydWN0dXJlLXN0YWNrXCI7XG5cbmNvbnN0IGFwcCA9IG5ldyBjZGsuQXBwKCk7XG5cbi8vIHRhZ3MgZm9yIG91ciBzdGFja3NcbmNvbnN0IHRhZ3MgPSB7XG4gIFwidW1jY3Itb3JnOlN0YWNrXCI6IFwiRWxzYURhdGFJbmZyYXN0cnVjdHVyZVwiLFxuICBcInVtY2NyLW9yZzpQcm9kdWN0XCI6IFwiRWxzYURhdGFcIixcbn07XG5cbmNvbnN0IGRlc2NyaXB0aW9uID1cbiAgXCJJbmZyYXN0cnVjdHVyZSBmb3IgRWxzYSBEYXRhIC0gYW4gYXBwbGljYXRpb24gZm9yIGNvbnRyb2xsZWQgZ2Vub21pYyBkYXRhIHNoYXJpbmdcIjtcblxuLyoqXG4gKiBEZXZlbG9wbWVudCBmcmllbmRseSBmb3IgZGV2IGFjY291bnRzXG4gKi9cbm5ldyBJbmZyYXN0cnVjdHVyZVN0YWNrKGFwcCwgXCJFbHNhRGF0YURldkluZnJhc3RydWN0dXJlU3RhY2tcIiwge1xuICAvLyBkZXBsb3kgdGhpcyBpbmZyYXN0cnVjdHVyZSB0byBkZXZcbiAgZW52OiB7XG4gICAgYWNjb3VudDogXCI4NDM0MDc5MTY1NzBcIixcbiAgICByZWdpb246IFwiYXAtc291dGhlYXN0LTJcIixcbiAgfSxcbiAgdGFnczogdGFncyxcbiAgaXNEZXZlbG9wbWVudDogdHJ1ZSxcbiAgZGVzY3JpcHRpb246IGRlc2NyaXB0aW9uLFxuICBuZXR3b3JrOiB7XG4gICAgLy8gdXNlIHRoZSBkZXYgVlBDIHRoYXQgYWxyZWFkeSBleGlzdHNcbiAgICB2cGNOYW1lT3JEZWZhdWx0T3JOdWxsOiBcIm1haW4tdnBjXCIsXG4gIH0sXG4gIG5hbWVzcGFjZToge1xuICAgIG5hbWU6IFwiZWxzYS1kYXRhXCIsXG4gIH0sXG4gIGRuczoge1xuICAgIGhvc3RlZFpvbmVOYW1lOiBcImRldi51bWNjci5vcmdcIixcbiAgfSxcbiAgZGF0YWJhc2VzOiB7XG4gICAgZWxzYV9kYXRhX3NlcnZlcmxlc3NfZGF0YWJhc2U6IHtcbiAgICAgIHR5cGU6IFwicG9zdGdyZXMtc2VydmVybGVzcy0yXCIsXG4gICAgICBhZG1pblVzZXI6IFwiZWxzYV9hZG1pblwiLFxuICAgICAgZW5hYmxlTW9uaXRvcmluZzoge1xuICAgICAgICBjbG91ZHdhdGNoTG9nc0V4cG9ydHM6IFtcInBvc3RncmVzcWxcIl0sXG4gICAgICAgIGVuYWJsZVBlcmZvcm1hbmNlSW5zaWdodHM6IHRydWUsXG4gICAgICAgIG1vbml0b3JpbmdJbnRlcnZhbDogRHVyYXRpb24uc2Vjb25kcyg2MCksXG4gICAgICB9LFxuICAgICAgbWFrZVB1YmxpY2x5UmVhY2hhYmxlOiBmYWxzZSxcbiAgICAgIGRlc3Ryb3lPblJlbW92ZTogdHJ1ZSxcbiAgICAgIGVkZ2VEYjoge1xuICAgICAgICB2ZXJzaW9uOiBcIjMuMFwiLFxuICAgICAgICBtYWtlUHVibGljbHlSZWFjaGFibGU6IHtcbiAgICAgICAgICB1cmxQcmVmaXg6IFwiZWxzYS1kYXRhLWVkZ2UtZGJcIixcbiAgICAgICAgICBlbmFibGVVaToge30sXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgIH0sXG4gIH0sXG4gIHNlY3JldHNQcmVmaXg6IFwiRWxzYURhdGFEZXZcIiwgLy8gcHJhZ21hOiBhbGxvd2xpc3Qgc2VjcmV0XG59KTtcblxuLyoqXG4gKiBGb3IgZGVtb25zdHJhdGlvbiBvZiBFbHNhIGZvciBBdXN0cmFsaWFuIEdlbm9taWNzXG4gKi9cbm5ldyBJbmZyYXN0cnVjdHVyZVN0YWNrKFxuICBhcHAsXG4gIFwiRWxzYURhdGFEZW1vQXVzdHJhbGlhbkdlbm9taWNzSW5mcmFzdHJ1Y3R1cmVTdGFja1wiLFxuICB7XG4gICAgLy8gZGVwbG95IHRoaXMgaW5mcmFzdHJ1Y3R1cmUgdG8gYWdcbiAgICBlbnY6IHtcbiAgICAgIGFjY291bnQ6IFwiNjAyODM2OTQ1ODg0XCIsXG4gICAgICByZWdpb246IFwiYXAtc291dGhlYXN0LTJcIixcbiAgICB9LFxuICAgIHRhZ3M6IHRhZ3MsXG4gICAgaXNEZXZlbG9wbWVudDogZmFsc2UsXG4gICAgZGVzY3JpcHRpb246IGRlc2NyaXB0aW9uLFxuICAgIG5ldHdvcms6IHtcbiAgICAgIC8vIHdlIHdhbnQgaXQgdG8gY29uc3RydWN0IGEgbmV3IGN1c3RvbSBWUEMgdG8gbGltaXQgcG9zc2libGUgYnJlYWNoIHN1cmZhY2VcbiAgICAgIHZwY05hbWVPckRlZmF1bHRPck51bGw6IG51bGwsXG4gICAgfSxcbiAgICBuYW1lc3BhY2U6IHtcbiAgICAgIG5hbWU6IFwiZWxzYS1kYXRhLWRlbW9cIixcbiAgICB9LFxuICAgIGRuczoge1xuICAgICAgaG9zdGVkWm9uZU5hbWU6IFwiYWdoYS51bWNjci5vcmdcIixcbiAgICB9LFxuICAgIGRhdGFiYXNlczoge1xuICAgICAgZWxzYV9kYXRhX3NlcnZlcmxlc3NfZGF0YWJhc2U6IHtcbiAgICAgICAgdHlwZTogXCJwb3N0Z3Jlcy1zZXJ2ZXJsZXNzLTJcIixcbiAgICAgICAgYWRtaW5Vc2VyOiBcImVsc2FfZGF0YV9zZXJ2ZXJsZXNzX2FkbWluXCIsXG4gICAgICAgIGVuYWJsZU1vbml0b3Jpbmc6IHtcbiAgICAgICAgICBjbG91ZHdhdGNoTG9nc0V4cG9ydHM6IFtcInBvc3RncmVzcWxcIl0sXG4gICAgICAgICAgZW5hYmxlUGVyZm9ybWFuY2VJbnNpZ2h0czogdHJ1ZSxcbiAgICAgICAgICBtb25pdG9yaW5nSW50ZXJ2YWw6IER1cmF0aW9uLnNlY29uZHMoNjApLFxuICAgICAgICB9LFxuICAgICAgICBtYWtlUHVibGljbHlSZWFjaGFibGU6IGZhbHNlLFxuICAgICAgICBkZXN0cm95T25SZW1vdmU6IHRydWUsXG4gICAgICAgIGVkZ2VEYjoge1xuICAgICAgICAgIHZlcnNpb246IFwiMy4wXCIsXG4gICAgICAgICAgLy8gZm9yIHJlc2V0dGluZy9zZXR1cCBvZiB0aGUgZGVtbyBpbnN0YW5jZSBpdCBpcyB1c2VmdWwgZm9yIHRoZSBFZGdlRGIgdG8gYmUgYWNjZXNzaWJsZVxuICAgICAgICAgIG1ha2VQdWJsaWNseVJlYWNoYWJsZToge1xuICAgICAgICAgICAgdXJsUHJlZml4OiBcImVsc2EtZGF0YS1kZW1vLWVkZ2UtZGJcIixcbiAgICAgICAgICAgIGVuYWJsZVVpOiB7fSxcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICB9LFxuICAgIHNlY3JldHNQcmVmaXg6IFwiRWxzYURhdGFEZW1vXCIsIC8vIHByYWdtYTogYWxsb3dsaXN0IHNlY3JldFxuICB9XG4pO1xuXG4vKipcbiAqIEZvciBwcm9kdWN0aW9uIEVsc2EgZm9yIEF1c3RyYWxpYW4gR2Vub21pY3NcbiAqIC0gY3VycmVudGx5IG5vIGRhdGFiYXNlIC0gYXMgd2Ugb25seSBzcGluIHRoaXMgdXAgdG8gb2NjYXNpb25hbGx5XG4gKiAgIGRvIGEgbWFudWFsIGNvcHkgb3V0XG4gKi9cbm5ldyBJbmZyYXN0cnVjdHVyZVN0YWNrKFxuICBhcHAsXG4gIFwiRWxzYURhdGFQcm9kQXVzdHJhbGlhbkdlbm9taWNzSW5mcmFzdHJ1Y3R1cmVTdGFja1wiLFxuICB7XG4gICAgLy8gZGVwbG95IHRoaXMgaW5mcmFzdHJ1Y3R1cmUgdG8gYWdcbiAgICBlbnY6IHtcbiAgICAgIGFjY291bnQ6IFwiNjAyODM2OTQ1ODg0XCIsXG4gICAgICByZWdpb246IFwiYXAtc291dGhlYXN0LTJcIixcbiAgICB9LFxuICAgIHRhZ3M6IHRhZ3MsXG4gICAgaXNEZXZlbG9wbWVudDogZmFsc2UsXG4gICAgZGVzY3JpcHRpb246IGRlc2NyaXB0aW9uLFxuICAgIG5ldHdvcms6IHtcbiAgICAgIC8vIHdlIHdhbnQgaXQgdG8gY29uc3RydWN0IGEgbmV3IGN1c3RvbSBWUEMgdG8gbGltaXQgcG9zc2libGUgYnJlYWNoIHN1cmZhY2VcbiAgICAgIHZwY05hbWVPckRlZmF1bHRPck51bGw6IG51bGwsXG4gICAgfSxcbiAgICBuYW1lc3BhY2U6IHtcbiAgICAgIG5hbWU6IFwiZWxzYS1kYXRhLXByb2RcIixcbiAgICB9LFxuICAgIGRuczoge1xuICAgICAgaG9zdGVkWm9uZU5hbWU6IFwiYWdoYS51bWNjci5vcmdcIixcbiAgICB9LFxuICAgIHNlY3JldHNQcmVmaXg6IFwiRWxzYURhdGFQcm9kXCIsIC8vIHByYWdtYTogYWxsb3dsaXN0IHNlY3JldFxuICB9XG4pO1xuIl19
