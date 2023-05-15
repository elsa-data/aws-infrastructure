import {
  aws_ec2 as ec2,
  aws_ecs as ecs,
  aws_iam as iam,
  aws_logs as logs,
} from "aws-cdk-lib";
import { Construct } from "constructs";
import {
  CpuArchitecture,
  FargateService,
  FargateTaskDefinition,
  LogDrivers,
  OperatingSystemFamily,
  Protocol,
} from "aws-cdk-lib/aws-ecs";
import { ISecret } from "aws-cdk-lib/aws-secretsmanager";
import { ISecurityGroup, SecurityGroup } from "aws-cdk-lib/aws-ec2";

/**
 * A collection of props that are set in the highest level EdgeDb construct
 * but which are then passed through to this construct.
 */
export type EdgeDbServicePassthroughProps = {
  // the DSN of the Postgres db it will use for its store (the DSN must include base db user/pw)
  baseDbDsn: string;

  // the security group of the Postgres database this service needs to live in
  baseDbSecurityGroup: ISecurityGroup;

  // the settings for containers of the service
  desiredCount: number;
  cpu: number;
  memory: number;

  // the edge db superuser name
  superUser: string;

  // edge db version string for the docker image used for edge db e.g. "2.3"
  edgeDbVersion: string;
};

/**
 * An augmenting of the high level passthrough props with other
 * settings we have created on the way.
 */
type EdgeDbServiceProps = EdgeDbServicePassthroughProps & {
  isDevelopment?: boolean;

  // the VPC that the service will live in
  vpc: ec2.IVpc;

  // the secret holding the edge db superuser password
  superUserSecret: ISecret;
};

/**
 * The EdgeDb service is a Fargate task cluster running the EdgeDb
 * Docker image and pointing to an external Postgres database.
 *
 * The service is set up to use self-signed certs in anticipation that
 * a network load balancer will sit in front of it.
 */
export class EdgeDbServiceConstruct extends Construct {
  // the fargate service is predicated on using the default edgedb port
  // so if you want to change this then you'll have to add some extra PORT settings in various places
  private readonly EDGE_DB_PORT = 5656;

  private readonly _service: FargateService;
  private readonly _securityGroup: SecurityGroup;

  constructor(scope: Construct, id: string, props: EdgeDbServiceProps) {
    super(scope, id);

    const cluster = new ecs.Cluster(this, "Cluster", {
      vpc: props.vpc,
    });

    const executionRole = new iam.Role(this, "ExecutionRole", {
      assumedBy: new iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AmazonECSTaskExecutionRolePolicy"
        ),
      ],
    });

    const clusterLogGroup = new logs.LogGroup(this, "ServiceLog", {
      retention: logs.RetentionDays.ONE_WEEK,
    });

    // we do the task definition by hand as we have some specialised settings (ARM64 etc)
    const taskDefinition = new FargateTaskDefinition(this, "TaskDefinition", {
      runtimePlatform: {
        operatingSystemFamily: OperatingSystemFamily.LINUX,
        cpuArchitecture: CpuArchitecture.ARM64,
      },
      memoryLimitMiB: props.memory,
      cpu: props.cpu,
      executionRole: executionRole,
      family: "edge-db-service-family",
    });

    const containerName = "edge-db";

    const env: { [k: string]: string } = {
      EDGEDB_DOCKER_LOG_LEVEL: "debug",
      // the DSN (including postgres user/pw) pointing to the base database
      EDGEDB_SERVER_BACKEND_DSN: props.baseDbDsn,
      // we allow the superuser name to be set
      EDGEDB_SERVER_USER: props.superUser,
      // we don't do edgedb certs at all - rely on self-signed always
      // when putting a TLS terminated network load balancer in front of this - we can
      // use a self-signed cert as the internal target TLS
      // NLBs are comfortable using self-signed certs purely for traffic encryption
      // https://kevin.burke.dev/kevin/aws-alb-validation-tls-reply/
      // that way we can avoid needing to manage custom certs/cas
      EDGEDB_SERVER_TLS_CERT_MODE: "generate_self_signed",
      // DO NOT ENABLE
      // EDGEDB_SERVER_DEFAULT_AUTH_METHOD: "Trust"
    };

    const secrets: { [k: string]: ecs.Secret } = {
      // CDK is smart enough to grant permissions to read these secrets to the execution role
      EDGEDB_SERVER_PASSWORD: ecs.Secret.fromSecretsManager(
        props.superUserSecret
      ),
    };

    if (props.isDevelopment) env.EDGEDB_SERVER_ADMIN_UI = "enabled";

    const container = taskDefinition.addContainer(containerName, {
      // https://hub.docker.com/r/edgedb/edgedb/tags
      image: ecs.ContainerImage.fromRegistry(
        `edgedb/edgedb:${props.edgeDbVersion}`
      ),
      environment: env,
      secrets: secrets,
      logging: LogDrivers.awsLogs({
        streamPrefix: "edge-db",
        logGroup: clusterLogGroup,
      }),
    });

    container.addPortMappings({
      containerPort: this.EDGE_DB_PORT,
      protocol: Protocol.TCP,
    });

    // we can't put the EdgeDb service *only* in the db security group because that group has no egress
    // rules (unlike RDS - EdgeDb needs to speak to the internet to fetch images etc)
    // so we also need to make our own more permissive group
    this._securityGroup = new SecurityGroup(this, "EdgeDbSecurityGroup", {
      vpc: props.vpc,
    });

    this._service = new FargateService(this, "EdgeDbService", {
      // even in dev mode we never want to assign public ips to the fargate service...
      // we always want to access via network load balancer
      assignPublicIp: false,
      cluster: cluster,
      desiredCount: props.desiredCount,
      taskDefinition: taskDefinition,
      vpcSubnets: {
        // we need egress in order to fetch images?? if we setup with private link maybe avoid? one to investigate?
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      securityGroups: [this._securityGroup, props.baseDbSecurityGroup],
    });

    // NOTE this fargate service is only for accessing via a NLB - but NLBs inherit the
    // security group rules of their targets - so effectively this is setting the access
    // rules for the EdgeDb NLB
    if (props.isDevelopment) {
      // development can be accessed from any IP
      this._securityGroup.addIngressRule(
        ec2.Peer.anyIpv4(),
        ec2.Port.tcp(this.EDGE_DB_PORT)
      );
    } else {
      // for prod - we restrict to instances in the Edgedb security group
      this._securityGroup.addIngressRule(
        this._securityGroup,
        ec2.Port.tcp(this.EDGE_DB_PORT)
      );
    }
  }

  public get service(): FargateService {
    return this._service;
  }

  public get servicePort(): number {
    return this.EDGE_DB_PORT;
  }

  public get securityGroup(): ISecurityGroup {
    return this._securityGroup;
  }
}
