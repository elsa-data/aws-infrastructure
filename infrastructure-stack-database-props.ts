import { InstanceType } from "aws-cdk-lib/aws-ec2";
import { PostgresEngineVersion } from "aws-cdk-lib/aws-rds";
import { Duration } from "aws-cdk-lib";

/**
 * A regular Postgres instance database type we can
 * ask to be installed as part of our infrastructure
 */
export type PostgresInstance = PostgresCommon & {
  type: "postgres-instance";

  instanceType?: InstanceType;

  /**
   * If set will override the postgres engine used - otherwise
   * we will make this by default aggressively track the latest postgres release
   */
  overridePostgresVersion?: PostgresEngineVersion;
};

/**
 * A serverless V2 Postgres instance database type we can
 * ask to be installed as part of our infrastructure
 */
export type PostgresServerlessV2 = PostgresCommon & {
  type: "postgres-serverless-2";

  minCapacity: number;

  maxCapacity: number;
};

/**
 * Settings common between all postgres databases
 */
export type PostgresCommon = {
  // the name of the admin user to create in the database
  adminUser: string;

  // if present and true, will set the database such that it will autodelete/autoremove when the stack is destroyed
  destroyOnRemove?: boolean;

  // if present and true, will place the database such that it can be reached from public IP addresses
  makePubliclyReachable?: boolean;

  // if set will override the allocated storage for the db - otherwise
  // we will have this set to smallest database size allowed (20 Gib)
  overrideAllocatedStorage?: number;

  // allow us to enable monitoring features such as postgres logs exported to cloudwatch and performance insights.
  enableMonitoring?: {
    cloudwatchLogsExports: string[];
    enablePerformanceInsights: true;
    monitoringInterval: Duration;
  };

  // if present - instruct us to create an edgedb in front of this db
  edgeDb?: EdgeDbCommon;
};

/**
 * Settings that instruct us to connect an EdgeDb
 * in front of the given postgres instance
 */
export type EdgeDbCommon = {
  // the version string of EdgeDb that will be used for the spun up EdgeDb image
  readonly version: string;

  // the memory assigned to the Edge Db service - defaults to a sensible value
  readonly memoryLimitMiB?: number;

  // the cpu assigned to the Edge Db service - defaults to a sensible value
  readonly cpu?: number;

  // the port number to assign for EdgeDb protocol - defaults to 5656
  readonly dbPort?: number;

  // if present, will place the EdgeDb such that it can be reached from public IP addresses
  readonly makePubliclyReachable?: {
    // the DNS prefix to expose the EdgeDb instance as
    readonly urlPrefix: string;

    // if present - switch on the HTML user interface for the EdgeDb instance
    readonly enableUi?: {
      // the port number to assign for UI access - defaults to 443
      readonly uiPort?: number;
    };
  };
};
