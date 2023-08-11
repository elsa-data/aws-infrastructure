import { InstanceType } from "aws-cdk-lib/aws-ec2";
import {
  AuroraPostgresEngineVersion,
  PostgresEngineVersion,
} from "aws-cdk-lib/aws-rds";
import { Duration } from "aws-cdk-lib";

/**
 * A regular Postgres instance database type we can
 * ask to be installed as part of our infrastructure
 */
export type PostgresInstance = PostgresCommon & {
  type: "postgres-instance";

  /**
   * The specific instance type - otherwise default to a small burstable
   */
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

  /**
   * The minimum number of ACU - or default to the minimum of 0.5
   */
  minCapacity?: number;

  /**
   * The maximum number of ACU - or default to a sensible 4
   */
  maxCapacity?: number;

  /**
   * If set will override the postgres engine used - otherwise
   * we will make this by default aggressively track the latest postgres release
   */
  overridePostgresVersion?: AuroraPostgresEngineVersion;
};

/**
 * Settings common between all postgres databases
 */
export type PostgresCommon = {
  /**
   * The name of the admin user to create in the database
   */
  adminUser: string;

  /**
   * If present and true, will set the database such that
   * it will autodelete/autoremove when the stack is destroyed
   */
  destroyOnRemove?: boolean;

  /**
   * If present and true, will place the database such that
   * it can be reached from public IP addresses
   */
  makePubliclyReachable?: boolean;

  /**
   * If set will override the allocated storage for the db - otherwise
   * we will have this set to smallest database size allowed (20 Gib)
   */
  overrideAllocatedStorage?: number;

  /**
   * If present switches on monitoring features such as postgres
   * logs exported to cloudwatch and performance insights.
   */
  enableMonitoring?: {
    cloudwatchLogsExports: string[];
    enablePerformanceInsights: true;
    monitoringInterval: Duration;
  };

  /**
   * If present - instruct us to create an edgedb in front of this db
   */
  edgeDb?: EdgeDbCommon;
};

/**
 * Settings that instruct us to connect an EdgeDb
 * in front of the given postgres instance
 */
export type EdgeDbCommon = {
  /**
   * The version string of EdgeDb that will be used for the spun up EdgeDb image
   */
  readonly version: string;

  /**
   * The memory assigned to the Edge Db service - defaults to a sensible value
   */
  readonly memoryLimitMiB?: number;

  /**
   * The cpu assigned to the Edge Db service - defaults to a sensible value
   */
  readonly cpu?: number;

  /**
   * The port number to assign for EdgeDb protocol - defaults to 5656 which
   * is what is assumed for edgedb connections
   */
  readonly dbPort?: number;

  /**0
   * If present, will make the EdgeDb UI exposed publicly
   */
  readonly makePubliclyReachable?: {
    /**
     * the DNS prefix to expose the EdgeDb UI as
     */
    readonly urlPrefix: string;

    /**
     * The port number to assign for UI access - defaults to 443
     */
    readonly uiPort?: number;
  };
};
