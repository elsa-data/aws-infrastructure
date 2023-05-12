import { InstanceType, IVpc } from "aws-cdk-lib/aws-ec2";
import { ISecret } from "aws-cdk-lib/aws-secretsmanager";
import {aws_ec2 as ec2, aws_rds as rds, Duration, RemovalPolicy} from "aws-cdk-lib";
import {DatabaseInstance, PostgresEngineVersion} from "aws-cdk-lib/aws-rds";
import { Construct } from "constructs";
import { BaseDatabase } from "./base-database";

export interface InstanceBaseDatabaseProps {
  databaseName: string;

  vpc: IVpc;

  secret: ISecret;

  // the database admin user - whilst this *is* stored inside the secret
  // we cannot get it out other than using CDK tokens. Given the outer stack
  // will know this as a real value *and* it is not actually a secret itself,
  // we pass it in for use in DSNs.
  databaseAdminUser: string;

  instanceType: InstanceType;

  destroyOnRemove?: boolean;

  makePubliclyReachable?: boolean;

  // if set will override the postgres engine used - otherwise
  // we will make this by default aggressively track the latest postgres release
  overridePostgresVersion?: PostgresEngineVersion;

  // if set will override the allocated storage for the db - otherwsie
  // we will have this set to smallest database size allowed (20 Gib)
  overrideAllocatedStorage?: number;

  // Allow monitoring features such as postgres logs exported to cloudwatch and performance insights.
  enableMonitoring?: {
    cloudwatchLogsExports: string[],
    enablePerformanceInsights: true,
    monitoringInterval: Duration,
  };
}

/**
 * A construct representing a base database to install - in this
 * case representing a simple Postgres instance.
 */
export class InstanceBaseDatabase extends BaseDatabase {
  private readonly _instance: DatabaseInstance;
  private readonly _dsnWithTokens: string;
  private readonly _dsnNoPassword: string;

  constructor(scope: Construct, id: string, props: InstanceBaseDatabaseProps) {
    super(scope, id);

    const engine = rds.DatabaseInstanceEngine.postgres({
        version: props.overridePostgresVersion ?? PostgresEngineVersion.VER_14,
      });

    this._instance = new DatabaseInstance(scope, "DatabaseInstance", {
      removalPolicy: props.destroyOnRemove
        ? RemovalPolicy.DESTROY
        : RemovalPolicy.SNAPSHOT,
      engine: engine,
      credentials: rds.Credentials.fromSecret(props.secret),
      deleteAutomatedBackups: props.destroyOnRemove,
      // base AWS encryption at rest
      storageEncrypted: true,
      databaseName: props.databaseName,
      instanceType: props.instanceType,
      allocatedStorage: props.overrideAllocatedStorage ?? 20,
      maxAllocatedStorage: 100,
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: props.makePubliclyReachable
          ? ec2.SubnetType.PUBLIC
          : ec2.SubnetType.PRIVATE_ISOLATED,
      },
      ...(props.enableMonitoring && { ...props.enableMonitoring })
    });

    this._dsnWithTokens =
      `postgres://` +
      `${props.secret.secretValueFromJson("username").unsafeUnwrap()}` +
      `:` +
      `${props.secret.secretValueFromJson("password").unsafeUnwrap()}` +
      `@${this.hostname}:${this._instance.instanceEndpoint.port}/${props.databaseName}`;

    this._dsnNoPassword =
      `postgres://` +
      `${props.databaseAdminUser}@${this._instance.instanceEndpoint.hostname}:${this._instance.instanceEndpoint.port}/${props.databaseName}`;
  }

  public get dsnWithTokens(): string {
    return this._dsnWithTokens;
  }

  public get dsnNoPassword(): string {
    return this._dsnNoPassword;
  }

  public get hostname(): string {
    return this._instance.instanceEndpoint.hostname;
  }

  public get port(): number {
    return this._instance.instanceEndpoint.port;
  }

  public connections() {
    return this._instance.connections;
  }
}
