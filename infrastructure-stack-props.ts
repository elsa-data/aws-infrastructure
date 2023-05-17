import { StackProps } from "aws-cdk-lib";
import {
  PostgresInstance,
  PostgresServerlessV2,
} from "./infrastructure-stack-database-props";

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

  /**
   * The configuration of the private API only namespace associated with
   * *all* apps/services in this infrastructure
   */
  namespace?: {
    /**
     * Controls the CloudMap namespace that will be created
     */
    name: string;
  };

  /**
   * The configuration of any DNS associated with *all* applications that will be
   * installed to this infrastructure
   */
  dns?: {
    /**
     * Specifies a Route 53 zone under our control that we will create
     * a wildcard SSL certificate for
     */
    hostedZoneName: string;
  };

  /**
   * The configuration of any databases we want to spin up.
   * Keyed by the database name.
   */
  databases?: {
    [name: string]: PostgresInstance | PostgresServerlessV2;
  };

  /**
   * A prefix that is used for constructing any AWS secrets associated with
   * this infrastructure (i.e. postgres password).
   * Any application should set up a wildcard policy to allow getting
   * this value (with a trailing wildcard "*")
   */
  secretsPrefix: string;
}
