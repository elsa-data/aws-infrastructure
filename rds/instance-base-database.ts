import {
  InstanceType,
  ISecurityGroup,
  IVpc,
  Port,
  Protocol,
  SecurityGroup,
} from "aws-cdk-lib/aws-ec2";
import { ISecret } from "aws-cdk-lib/aws-secretsmanager";
import {
  aws_ec2 as ec2,
  aws_rds as rds,
  Duration,
  RemovalPolicy,
} from "aws-cdk-lib";
import { DatabaseInstance, PostgresEngineVersion } from "aws-cdk-lib/aws-rds";
import { Construct } from "constructs";
import { BaseDatabase } from "./base-database";

export interface InstanceBaseDatabaseProps {
  databaseName: string;

  vpc: IVpc;

  // the secret of the database admin password to use
  secret: ISecret;

  // the database admin user - whilst this *is* stored inside the secret
  // we cannot get it out other than using CDK tokens. Given the outer stack
  // will know this as a real value *and* it is not actually a secret itself,
  // we pass it in for use in DSNs.
  databaseAdminUser: string;

  instanceType: InstanceType;

  // if present and true, will set the database such that it will autodelete/autoremove when the stack is destroyed
  destroyOnRemove?: boolean;

  // if present and true, will place the database such that it can be reached from public IP addresses
  makePubliclyReachable?: boolean;

  // if set will override the postgres engine used - otherwise
  // we will make this by default aggressively track the latest postgres release
  overridePostgresVersion?: PostgresEngineVersion;

  // if set will override the allocated storage for the db - otherwise
  // we will have this set to the smallest database size allowed (20 Gib)
  overrideAllocatedStorage?: number;

  // Allow monitoring features such as postgres logs exported to cloudwatch and performance insights.
  enableMonitoring?: {
    cloudwatchLogsExports: string[];
    enablePerformanceInsights: true;
    monitoringInterval: Duration;
  };
}

/**
 * A construct representing a base database to install - in this
 * case representing a simple Postgres instance.
 */
export class InstanceBaseDatabase extends BaseDatabase {
  private readonly _instance: DatabaseInstance;
  private readonly _securityGroup: SecurityGroup;
  private readonly _dsnWithTokens: string;
  private readonly _dsnNoPassword: string;

  constructor(scope: Construct, id: string, props: InstanceBaseDatabaseProps) {
    super(scope, id);

    // we create a security group and export its id - so we can use that as a security boundary
    // for services that "can connect to database"
    this._securityGroup = this.createStandardSecurityGroup(props.vpc);

    const engine = rds.DatabaseInstanceEngine.postgres({
      version: props.overridePostgresVersion ?? PostgresEngineVersion.VER_14,
    });

    this._instance = new DatabaseInstance(scope, "DatabaseInstance", {
      databaseName: props.databaseName,
      engine: engine,
      vpc: props.vpc,
      securityGroups: [this._securityGroup],
      vpcSubnets: {
        subnetType: props.makePubliclyReachable
          ? ec2.SubnetType.PUBLIC
          : ec2.SubnetType.PRIVATE_ISOLATED,
      },
      credentials: rds.Credentials.fromSecret(props.secret),
      // our props "destroy on remove" tells us we don't really care much about the data (demo instances etc)
      // so we set a bunch of settings accordingly
      removalPolicy: props.destroyOnRemove
        ? RemovalPolicy.DESTROY
        : RemovalPolicy.SNAPSHOT,
      backupRetention: props.destroyOnRemove ? Duration.days(0) : undefined,
      deleteAutomatedBackups: props.destroyOnRemove,
      // always enable base AWS encryption at rest
      storageEncrypted: true,
      instanceType: props.instanceType,
      allocatedStorage: props.overrideAllocatedStorage ?? 20,
      maxAllocatedStorage: 100,
      ...(props.enableMonitoring && { ...props.enableMonitoring }),
    });

    this.applySecurityGroupRules(
      this._securityGroup,
      this._instance.instanceEndpoint.port,
      props.makePubliclyReachable
    );

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

  public get securityGroup(): ISecurityGroup {
    return this._securityGroup;
  }
}
