import { aws_rds as rds, StackProps } from "aws-cdk-lib";
import { InstanceType, IVpc } from "aws-cdk-lib/aws-ec2";
import { PostgresEngineVersion } from "aws-cdk-lib/aws-rds";
import { ISecret } from "aws-cdk-lib/aws-secretsmanager";

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
};

export type PostgresInstance = PostgresCommon & {
  type: "postgres-instance";

  instanceType: InstanceType;

  // if set will override the postgres engine used - otherwise
  // we will make this by default aggressively track the latest postgres release
  overridePostgresVersion?: PostgresEngineVersion;
};

export type PostgresServerlessV2 = PostgresCommon & {
  type: "postgres-serverless-2";

  minCapacity: number;

  maxCapacity: number;
};

export interface InfrastructureStackProps extends StackProps {
  /**
   * A master control switch that tells us that this infrastructure is destined
   * for an environment that contains only development data. This will
   * control whether databases and buckets 'auto-delete' (for instance). It
   * may change the visibility of some resources (RDS instances) - but should in
   * no way expose any resource insecurely (i.e. they will still need passwords
   * even if the database is in a public subnet).
   *
   * The default assumption if this is not present is that all infrastructure
   * is as locked down as possible.
   */
  isDevelopment?: boolean;

  /**
   * The description of the infrastructure as used for the CloudFormation stack.
   * This gives devops an immediate feedback on the purpose of the stack so
   * should be descriptive of the service/project.
   * "Infrastructure for Blah - an application used to discover novel variants"
   */
  description: string;

  network: {
    /**
     * Controls the VPC that will be used, defaulted to, or constructed.
     * See vpc.ts.
     */
    vpcNameOrDefaultOrNull: string | "default" | null;
  };

  // the configuration of the private API only namespace associated with
  // *all* apps/services in this infrastructure
  namespace?: {
    /**
     * Controls the CloudMap namespace that will be created
     */
    name: string;
  };

  // the configuration of any DNS associated with *all* applications that will be
  // installed to this infrastructure
  dns?: {
    // specifies a Route 53 zone under our control that we will create
    // a wildcard SSL certificate for
    hostedZoneName: string;
  };

  // the configuration of the postgres instance which will be created
  database?: {
    // type: "serverless" | "instance";
    instanceType: InstanceType;
    dbAdminUser: string;
    dbName: string;
  };

  databases?: {
    [name: string]: PostgresInstance | PostgresServerlessV2;
  };

  // a prefix that is used for constructing any AWS secrets (i.e. postgres password)
  // If empty - the default AWS naming is used (which are decent names
  // but possibly uninformative of which postgres for instance). Eg we might end
  // up with 5 RdsSecretXYZ, RdsSecretAbc.. this allows to make
  // MyAppRdsSecretXYZ
  // this also helps out by allowing us to make wildcard secret policies that
  // encompass all secrets with the prefix
  secretsPrefix?: string;
}
