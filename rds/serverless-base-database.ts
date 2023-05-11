import { IVpc } from "aws-cdk-lib/aws-ec2";
import { ISecret } from "aws-cdk-lib/aws-secretsmanager";
import { ServerlessCluster } from "aws-cdk-lib/aws-rds";
import { Construct } from "constructs";
import {aws_ec2 as ec2, aws_rds as rds, Duration, RemovalPolicy} from "aws-cdk-lib";
import { BaseDatabase } from "./base-database";
import {ManagedPolicy, Role, ServicePrincipal} from "aws-cdk-lib/aws-iam";

interface ServerlessBaseDatabaseProps {
  isDevelopment?: boolean;

  databaseName: string;

  vpc: IVpc;

  secret: ISecret;

  databaseAdminUser: string;

  // Allow monitoring features such as postgres logs exported to cloudwatch and performance insights.
  enableMonitoring?: {
    cloudwatchLogsExports: string[],
    enablePerformanceInsights: true,
    monitoringInterval: Duration,
  };
}

/**
 * A construct representing the base database we might use with EdgeDb - in this
 * case representing a V2 Serverless Aurora (in postgres mode).
 */
export class ServerlessBaseDatabase extends BaseDatabase {
  private readonly _cluster: ServerlessCluster;
  private readonly _dsnWithTokens: string;
  private readonly _dsnNoPassword: string;

  constructor(
    scope: Construct,
    id: string,
    props: ServerlessBaseDatabaseProps
  ) {
    super(scope, id);

    this._cluster = new ServerlessCluster(this, "ServerlessCluster", {
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: props.isDevelopment
          ? ec2.SubnetType.PUBLIC
          : ec2.SubnetType.PRIVATE_ISOLATED,
      },
      engine: rds.DatabaseClusterEngine.auroraPostgres({ version: rds.AuroraPostgresEngineVersion.VER_14_6 }),
      // the default database to create in the cluster - we insist on it being named otherwise no default db is made
      defaultDatabaseName: props.databaseName,
      credentials: rds.Credentials.fromSecret(props.secret),
      removalPolicy: props.isDevelopment
        ? RemovalPolicy.DESTROY
        : RemovalPolicy.SNAPSHOT,
    });

    // temporary fix to broken CDK constructs
    // https://github.com/aws/aws-cdk/issues/20197#issuecomment-1272360016
    {
      const cfnDBCluster = this._cluster.node.children.find(
        (node) => node instanceof rds.CfnDBCluster
      ) as rds.CfnDBCluster;
      cfnDBCluster.serverlessV2ScalingConfiguration = {
        minCapacity: 0.5,
        maxCapacity: rds.AuroraCapacityUnit.ACU_4,
      };
      cfnDBCluster.engineMode = undefined;
    }

    let enableMonitoring;
    if (props.enableMonitoring) {
      const monitoringRole = new Role(this, "DatabaseMonitoringRole", {
        assumedBy: new ServicePrincipal("monitoring.rds.amazonaws.com")
      });
      monitoringRole.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName("service-role/AmazonRDSEnhancedMonitoringRole"));

      enableMonitoring = {
        enablePerformanceInsights: props.enableMonitoring.enablePerformanceInsights,
        cloudwatchLogsExports: props.enableMonitoring.cloudwatchLogsExports,
        monitoringInterval: props.enableMonitoring.monitoringInterval.toSeconds(),
        monitoringRoleArn: monitoringRole.roleArn,
      };
    }

    const writerInstance = new rds.CfnDBInstance(this, "Writer", {
      dbInstanceClass: "db.serverless",
      dbClusterIdentifier: this._cluster.clusterIdentifier,
      engine: "aurora-postgresql",
      publiclyAccessible: !!props.isDevelopment,
      ...(enableMonitoring && {...enableMonitoring})
    });

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
      `${props.databaseAdminUser}@${this._cluster.clusterEndpoint.hostname}:${this._cluster.clusterEndpoint.port}/${props.databaseName}`;
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

  public connections(): ec2.Connections {
    return this._cluster.connections;
  }
}
