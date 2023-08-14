import { StackProps } from "aws-cdk-lib";
import { PostgresCommon } from "./infrastructure-stack-database-props";

export interface InfrastructureStackNetworkProps {
  /**
   * Controls the VPC that will be used, defaulted to, or constructed.
   * See vpc.ts.
   */
  readonly vpcNameOrDefaultOrUndefined?: string;
}

export interface InfrastructureStackNamespaceProps {
  /**
   * Controls the CloudMap namespace that will be created
   */
  readonly name: string;
}

export interface InfrastructureStackDnsProps {
  /**
   * Specifies a Route 53 zone under our control that we will create
   * a wildcard SSL certificate for
   */
  readonly hostedZoneName: string;
}

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
  readonly isDevelopment?: boolean;

  /**
   * The configuration of a new network - or existing network to re-use.
   */
  readonly network: InfrastructureStackNetworkProps;

  /**
   * The configuration of the private API only namespace associated with
   * *all* apps/services in this infrastructure
   */
  readonly ns?: InfrastructureStackNamespaceProps;

  /**
   * The configuration of any DNS associated with *all* applications that will be
   * installed to this infrastructure
   */
  readonly dns?: InfrastructureStackDnsProps;

  /**
   * The configuration of any databases we want to spin up.
   */
  readonly databases?: PostgresCommon[];

  /**
   * A prefix that is used for constructing any AWS secrets associated with
   * this infrastructure (i.e. postgres password secret).
   * Any application should set up a wildcard policy to allow getting
   * this value (with a trailing wildcard "*")
   */
  readonly secretsPrefix: string;
}
