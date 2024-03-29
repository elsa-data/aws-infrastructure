import { ArnComponents, aws_route53 as route53, Stack } from "aws-cdk-lib";
import { StringParameter } from "aws-cdk-lib/aws-ssm";
import { IVpc, SecurityGroup, Vpc, VpcAttributes } from "aws-cdk-lib/aws-ec2";
import {
  HttpNamespace,
  IHttpNamespace,
} from "aws-cdk-lib/aws-servicediscovery";
import { Certificate, ICertificate } from "aws-cdk-lib/aws-certificatemanager";
import { IHostedZone } from "aws-cdk-lib/aws-route53";
import { Construct } from "constructs";
import { PolicyStatement } from "aws-cdk-lib/aws-iam";
import {
  certificateArnParameterName,
  databaseEdgeDbSecurityGroupIdParameterName,
  namespaceArnParameterName,
  namespaceIdParameterName,
  namespaceNameParameterName,
  secretsManagerSecretsPrefixParameterName,
  vpcAvailabilityZonesParameterName,
  vpcIdParameterName,
  vpcIsolatedSubnetIdsParameterName,
  vpcIsolatedSubnetRouteTableIdsParameterName,
  vpcPrivateSubnetIdsParameterName,
  vpcPrivateSubnetRouteTableIdsParameterName,
  vpcPublicSubnetIdsParameterName,
  vpcPublicSubnetRouteTableIdsParameterName,
} from "./parameter-names";
import { ISecret, Secret } from "aws-cdk-lib/aws-secretsmanager";
import { Bucket, IBucket } from "aws-cdk-lib/aws-s3";

export interface DnsResult {
  readonly hostedZone: IHostedZone;
  readonly certificate: ICertificate;
}

type Mutable<T> = {
  -readonly [k in keyof T]: T[k];
};

export class InfrastructureClient {
  constructor(protected infrastructureStackId: string) {}

  /**
   * Workaround for a problem with CDK that on initial pass the values of a valueFromLookup
   * are not valid ARNS - which then causes other code to fail - even though eventually the
   * value *will* be a real ARN.
   *
   * See https://github.com/josephedward/aws-cdk/commit/33030e0c2bb46fa909540bff6ae0153d48abc9c2
   *
   * @param scope
   * @param parameterName
   * @param dummyComponents
   */
  private delayedArnLookupHelper(
    scope: Construct,
    parameterName: string,
    dummyComponents: ArnComponents,
  ): string {
    // attempt to get the value from CDK - this might be a dummy value however
    const lookupValue = StringParameter.valueFromLookup(scope, parameterName);

    let returnLookupValue: string;
    if (lookupValue.includes("dummy-value")) {
      // if dummy value - need to return a plausible ARN
      returnLookupValue = Stack.of(scope).formatArn(dummyComponents);
    } else {
      // else eventually return the real value
      returnLookupValue = lookupValue;
    }

    return returnLookupValue;
  }

  /**
   * Get a CDK VPC object from existing infrastructure.
   *
   * @param scope
   */
  public getVpcFromLookup(scope: Construct): IVpc {
    const getStringListLookup = (parameterName: string) => {
      const val = StringParameter.valueFromLookup(scope, parameterName);

      if (val && val.length > 0) return val.split(",");

      return undefined;
    };

    const vpcAttrs: Mutable<VpcAttributes> = {
      vpcId: StringParameter.valueFromLookup(
        scope,
        vpcIdParameterName(this.infrastructureStackId),
      ),
      availabilityZones: getStringListLookup(
        vpcAvailabilityZonesParameterName(this.infrastructureStackId),
      )!,
      publicSubnetIds: getStringListLookup(
        vpcPublicSubnetIdsParameterName(this.infrastructureStackId),
      ),
      publicSubnetRouteTableIds: getStringListLookup(
        vpcPublicSubnetRouteTableIdsParameterName(this.infrastructureStackId),
      ),
    };

    // depending on the values of these parameters we may decide to *not* have this subnet
    {
      vpcAttrs.privateSubnetIds = undefined;
      vpcAttrs.privateSubnetRouteTableIds = undefined;

      const privateSubs = getStringListLookup(
        vpcPrivateSubnetIdsParameterName(this.infrastructureStackId),
      );
      const privateSubRoutes = getStringListLookup(
        vpcPrivateSubnetRouteTableIdsParameterName(this.infrastructureStackId),
      );

      // we always construct these parameters in the infrastructure stack - but we set it
      // to "empty" to indicate that we don't want these subnets
      // NOTE: we also have to handle the CDK context stage here - which will return a "dummy-value"
      if (
        privateSubs &&
        privateSubs.length > 0 &&
        (privateSubs[0].includes("subnet-") ||
          privateSubs[0].includes("dummy-value-for"))
      ) {
        vpcAttrs.privateSubnetIds = privateSubs;
        vpcAttrs.privateSubnetRouteTableIds = privateSubRoutes;
      }
    }

    // depending on the values of these parameters we may decide to *not* have this subnet
    {
      vpcAttrs.isolatedSubnetIds = undefined;
      vpcAttrs.isolatedSubnetRouteTableIds = undefined;

      const isolatedSubs = getStringListLookup(
        vpcIsolatedSubnetIdsParameterName(this.infrastructureStackId),
      );
      const isolatedSubRoutes = getStringListLookup(
        vpcIsolatedSubnetRouteTableIdsParameterName(this.infrastructureStackId),
      );

      // we always construct these parameters in the infrastructure stack - but we set it
      // to "empty" to indicate that we don't want these subnets
      // NOTE: we also have to handle the CDK context stage here - which will return a "dummy-value"
      if (
        isolatedSubs &&
        isolatedSubs.length > 0 &&
        (isolatedSubs[0].includes("subnet-") ||
          isolatedSubs[0].includes("dummy-value-for"))
      ) {
        vpcAttrs.isolatedSubnetIds = isolatedSubs;
        vpcAttrs.isolatedSubnetRouteTableIds = isolatedSubRoutes;
      }
    }

    // actually make the VPC object
    return Vpc.fromVpcAttributes(scope, "VPC", vpcAttrs);
  }

  /**
   * Get a CDK CloudMap namespace object by reflecting values
   * out of Parameter Store.
   *
   * @param scope
   */
  public getNamespaceFromLookup(scope: Construct): IHttpNamespace {
    return HttpNamespace.fromHttpNamespaceAttributes(scope, "Namespace", {
      namespaceArn: StringParameter.valueFromLookup(
        scope,
        namespaceArnParameterName(this.infrastructureStackId),
      ),
      namespaceId: StringParameter.valueFromLookup(
        scope,
        namespaceIdParameterName(this.infrastructureStackId),
      ),
      namespaceName: StringParameter.valueFromLookup(
        scope,
        namespaceNameParameterName(this.infrastructureStackId),
      ),
    });
  }

  /**
   * Create some usable DNS CDK objects by reflecting values out of Parameter
   * Store.
   *
   * @param scope
   */
  public getDnsFromLookup(scope: Construct): DnsResult {
    const hostedZone = route53.HostedZone.fromHostedZoneAttributes(
      scope,
      "HostedZone",
      {
        hostedZoneId: StringParameter.valueFromLookup(
          scope,
          `/${this.infrastructureStackId}/HostedZone/hostedZoneId`,
        ),
        zoneName: StringParameter.valueFromLookup(
          scope,
          `/${this.infrastructureStackId}/HostedZone/zoneName`,
        ),
      },
    );

    const certificate = Certificate.fromCertificateArn(
      scope,
      "SslCert",
      StringParameter.valueFromLookup(
        scope,
        certificateArnParameterName(this.infrastructureStackId),
      ),
    );

    return {
      hostedZone,
      certificate,
    };
  }

  /**
   * Return a DSN for the given EdgeDb instance - the
   * DSN will *not* include the password OR the database name.
   *
   * @param scope
   * @param databaseInstanceName
   */
  public getEdgeDbDsnNoPasswordOrDatabaseFromLookup(
    scope: Construct,
    databaseInstanceName: string,
  ) {
    return StringParameter.valueFromLookup(
      scope,
      `/${this.infrastructureStackId}/Database/${databaseInstanceName}/EdgeDb/dsnNoPasswordOrDatabase`,
    );
  }

  /**
   * Return a security group that membership of will give access to the given
   * named EdgeDb instance.
   *
   * @param scope
   * @param databaseInstanceName
   */
  public getEdgeDbSecurityGroupFromLookup(
    scope: Construct,
    databaseInstanceName: string,
  ) {
    return SecurityGroup.fromSecurityGroupId(
      scope,
      "EdgeDbSecurityGroup",
      StringParameter.valueFromLookup(
        scope,
        databaseEdgeDbSecurityGroupIdParameterName(
          this.infrastructureStackId,
          databaseInstanceName,
        ),
      ),
      {
        // the client stacks where we use these security groups
        // should not ever edit the ingress/egress rules
        mutable: false,
      },
    );
  }

  /**
   * Return a secret that contains the administrator password for the given
   * EdgeDb instance.
   *
   * @param scope
   * @param databaseInstanceName
   */
  public getEdgeDbAdminPasswordSecretFromLookup(
    scope: Construct,
    databaseInstanceName: string,
  ): ISecret {
    return Secret.fromSecretCompleteArn(
      scope,
      "EdgeDbAdminSecret",
      this.delayedArnLookupHelper(
        scope,
        `/${this.infrastructureStackId}/Database/${databaseInstanceName}/EdgeDb/adminPasswordSecretArn`,
        {
          service: "secretsmanager",
          resource: "secret",
          resourceName: "adminPasswordSecretThoughThisIsNotReal",
        },
      ),
    );
  }

  /**
   * Return the temporary bucket.
   *
   * @param scope
   */
  public getTempBucketFromLookup(scope: Construct): IBucket {
    return Bucket.fromBucketArn(
      scope,
      "TempBucket",
      this.delayedArnLookupHelper(
        scope,
        `/${this.infrastructureStackId}/TempPrivateBucket/bucketArn`,
        {
          service: "s3",
          resource: "a-bucket-name-though-this-is-not-real",
        },
      ),
    );
  }

  /**
   * A prefix that should be prepended to all secret names. We can then
   * access secrets across all applications using a wildcard secret
   * policy.
   *
   * @param scope
   */
  public getSecretsPrefixFromLookup(scope: Construct): string {
    return StringParameter.valueFromLookup(
      scope,
      secretsManagerSecretsPrefixParameterName(this.infrastructureStackId),
    );
  }

  /**
   * A policy statement that we can use that gives access only to
   * known secrets (by naming convention) for this infrastructure.
   *
   * If applications create secrets according to the same prefix
   * then they will also be included in this policy.
   *
   * Obviously the secrets
   * prefix must not overlap with other stacks installed in the
   * same account.
   *
   * @param scope
   */
  public getSecretPolicyStatementFromLookup(scope: Construct): PolicyStatement {
    const secretsPrefix = StringParameter.valueFromLookup(
      scope,
      secretsManagerSecretsPrefixParameterName(this.infrastructureStackId),
    );

    return new PolicyStatement({
      actions: ["secretsmanager:GetSecretValue"],
      resources: [
        `arn:${Stack.of(scope).partition}:secretsmanager:${
          Stack.of(scope).region
        }:${Stack.of(scope).account}:secret:${secretsPrefix}*`,
      ],
    });
  }

  /**
   * Get a policy statement that allows discovery of instances in *only* the associated
   * namespace to this infrastructure.
   *
   * @param scope
   */
  public getCloudMapDiscoveryPolicyStatementFromLookup(
    scope: Construct,
  ): PolicyStatement {
    const nsArn = StringParameter.valueFromLookup(
      scope,
      namespaceArnParameterName(this.infrastructureStackId),
    );

    return new PolicyStatement({
      actions: ["servicediscovery:DiscoverInstances"],
      resources: [`*`],
      conditions: {
        StringEquals: {
          "servicediscovery:NamespaceArn": nsArn,
        },
      },
    });
  }
}
