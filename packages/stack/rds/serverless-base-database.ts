import { ISecurityGroup, IVpc, SecurityGroup } from "aws-cdk-lib/aws-ec2";
import { ISecret } from "aws-cdk-lib/aws-secretsmanager";
import { ClusterInstance, DatabaseCluster } from "aws-cdk-lib/aws-rds";
import { Construct } from "constructs";
import { aws_ec2 as ec2, aws_rds as rds, RemovalPolicy } from "aws-cdk-lib";
import { BaseDatabase } from "./base-database";
import { PostgresCommon } from "../infrastructure-stack-database-props";

type ServerlessBaseDatabaseProps = PostgresCommon & {
  vpc: IVpc;

  databaseName: string;

  secret: ISecret;
};

/**
 * A construct representing the base database we might use with EdgeDb - in this
 * case representing a V2 Serverless Aurora (in postgres mode).
 */
export class ServerlessBaseDatabase extends BaseDatabase {
  private readonly _cluster: DatabaseCluster;
  private readonly _securityGroup: SecurityGroup;
  private readonly _dsnWithTokens: string;
  private readonly _dsnNoPassword: string;

  constructor(
    scope: Construct,
    id: string,
    props: ServerlessBaseDatabaseProps,
  ) {
    super(scope, id);

    // we create a security group and export its id - so we can use that as a security boundary
    // for services that "can connect to database"
    this._securityGroup = this.createMembershipSecurityGroup(props.vpc);

    let enableMonitoring;
    if (props.enableMonitoring) {
      const monitoringRole = this.createMonitoringRole();

      enableMonitoring = {
        enablePerformanceInsights:
          props.enableMonitoring.enablePerformanceInsights,
        cloudwatchLogsExports: props.enableMonitoring.cloudwatchLogsExports,
        monitoringInterval:
          props.enableMonitoring.monitoringInterval.toSeconds(),
        monitoringRoleArn: monitoringRole.roleArn,
      };
    }

    // Serverless V2 Cluster.
    this._cluster = new DatabaseCluster(this, "Cluster", {
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: props.makePubliclyReachable
          ? ec2.SubnetType.PUBLIC
          : ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      securityGroups: [this._securityGroup],
      credentials: rds.Credentials.fromSecret(props.secret),
      // destroy on remove tells us we don't really care much about the data (demo instances etc)
      removalPolicy: props.destroyOnRemove
        ? RemovalPolicy.DESTROY
        : RemovalPolicy.SNAPSHOT,
      // the default database to create in the cluster - we insist on it being named otherwise no default db is made
      defaultDatabaseName: props.databaseName,
      engine: rds.DatabaseClusterEngine.auroraPostgres({
        version: rds.AuroraPostgresEngineVersion.VER_15_4,
      }),
      serverlessV2MinCapacity: props.minCapacity ?? 0.5,
      serverlessV2MaxCapacity:
        props.maxCapacity ?? rds.AuroraCapacityUnit.ACU_4,
      writer: ClusterInstance.serverlessV2("Writer", {
        ...(enableMonitoring && { ...enableMonitoring }),
      }),
    });

    this.applySecurityGroupRules(
      this._securityGroup,
      this._cluster.clusterEndpoint.port,
      props.makePubliclyReachable,
    );

    this._dsnWithTokens =
      `postgres://` +
      `${props.secret.secretValueFromJson("username").unsafeUnwrap()}` +
      `:` +
      `${props.secret.secretValueFromJson("password").unsafeUnwrap()}` +
      `@` +
      `${this._cluster.clusterEndpoint.hostname}` +
      `:` +
      `${this._cluster.clusterEndpoint.port}` +
      `/` +
      `${props.databaseName}`;

    this._dsnNoPassword =
      `postgres://` +
      `${props.adminUser}@${this._cluster.clusterEndpoint.hostname}:${this._cluster.clusterEndpoint.port}/${props.databaseName}`;
  }

  public get dsnWithTokens(): string {
    return this._dsnWithTokens;
  }

  public get dsnNoPassword(): string {
    return this._dsnNoPassword;
  }

  public get hostname(): string {
    return this._cluster.clusterEndpoint.hostname;
  }

  public get port(): number {
    return this._cluster.clusterEndpoint.port;
  }

  public get securityGroup(): ISecurityGroup {
    return this._securityGroup;
  }
}
