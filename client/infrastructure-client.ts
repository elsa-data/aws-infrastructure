import { aws_route53 as route53, Stack } from "aws-cdk-lib";
import { StringParameter } from "aws-cdk-lib/aws-ssm";
import { IVpc, SecurityGroup, Vpc } from "aws-cdk-lib/aws-ec2";
import {
  HttpNamespace,
  IHttpNamespace,
} from "aws-cdk-lib/aws-servicediscovery";
import { Certificate, ICertificate } from "aws-cdk-lib/aws-certificatemanager";
import {
  databaseEdgeDbSecurityGroupIdParameterName,
  namespaceArnParameterName,
  secretsManagerSecretsPrefixParameterName,
  vpcAvailabilityZonesParameterName,
  vpcIdParameterName,
  vpcIsolatedSubnetIdsParameterName,
  vpcIsolatedSubnetRouteTableIdsParameterName,
  vpcPrivateSubnetIdsParameterName,
  vpcPrivateSubnetRouteTableIdsParameterName,
  vpcPublicSubnetIdsParameterName,
  vpcPublicSubnetRouteTableIdsParameterName,
} from "elsa-data-aws-infrastructure-shared";
import { IHostedZone } from "aws-cdk-lib/aws-route53";
import { Construct } from "constructs";
import { PolicyStatement } from "aws-cdk-lib/aws-iam";

export interface DnsResult {
  readonly hostedZone: IHostedZone;
  readonly certificate: ICertificate;
}

export class ElsaDataInfrastructureClient {
  constructor(private infrastructureStackId: string) {}

  /**
   * Get a CDK VPC object from existing infrastructure.
   *
   * @param scope
   */
  public getVpcFromLookup(scope: Construct): IVpc {
    const getStringListLookup = (parameterName: string) => {
      return StringParameter.valueFromLookup(scope, parameterName).split(",");
    };

    return Vpc.fromVpcAttributes(scope, "VPC", {
      vpcId: StringParameter.valueFromLookup(
        scope,
        vpcIdParameterName(this.infrastructureStackId)
      ),
      availabilityZones: getStringListLookup(
        vpcAvailabilityZonesParameterName(this.infrastructureStackId)
      ),
      publicSubnetIds: getStringListLookup(
        vpcPublicSubnetIdsParameterName(this.infrastructureStackId)
      ),
      publicSubnetRouteTableIds: getStringListLookup(
        vpcPublicSubnetRouteTableIdsParameterName(this.infrastructureStackId)
      ),
      privateSubnetIds: getStringListLookup(
        vpcPrivateSubnetIdsParameterName(this.infrastructureStackId)
      ),
      privateSubnetRouteTableIds: getStringListLookup(
        vpcPrivateSubnetRouteTableIdsParameterName(this.infrastructureStackId)
      ),
      isolatedSubnetIds: getStringListLookup(
        vpcIsolatedSubnetIdsParameterName(this.infrastructureStackId)
      ),
      isolatedSubnetRouteTableIds: getStringListLookup(
        vpcIsolatedSubnetRouteTableIdsParameterName(this.infrastructureStackId)
      ),
    });
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
        `/${this.infrastructureStackId}/HttpNamespace/namespaceArn`
      ),
      namespaceId: StringParameter.valueFromLookup(
        scope,
        `/${this.infrastructureStackId}/HttpNamespace/namespaceId`
      ),
      namespaceName: StringParameter.valueFromLookup(
        scope,
        `/${this.infrastructureStackId}/HttpNamespace/namespaceName`
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
          `/${this.infrastructureStackId}/HostedZone/hostedZoneId`
        ),
        zoneName: StringParameter.valueFromLookup(
          scope,
          `/${this.infrastructureStackId}/HostedZone/zoneName`
        ),
      }
    );

    const certificate = Certificate.fromCertificateArn(
      scope,
      "SslCert",
      StringParameter.valueFromLookup(
        scope,
        `/${this.infrastructureStackId}/Certificate/certificateArn`
      )
    );

    return {
      hostedZone,
      certificate,
    };
  }

  /**
   * Return a security group that membership of will give access to the given
   * named EdgeDb.
   *
   * @param scope
   * @param databaseName
   */
  public getEdgeDbSecurityGroupFromLookup(
    scope: Construct,
    databaseName: string
  ) {
    return SecurityGroup.fromSecurityGroupId(
      scope,
      "EdgeDbSecurityGroup",
      StringParameter.valueFromLookup(
        scope,
        databaseEdgeDbSecurityGroupIdParameterName(
          this.infrastructureStackId,
          databaseName
        )
      ),
      {
        // the client stacks where we use these security groups
        // should not ever edit the ingress/egress rules
        mutable: false,
      }
    );
  }

  /**
   * A policy statement that we can use that gives access only to
   * known Elsa Data secrets (by naming convention).
   *
   * @param scope
   */
  public getSecretPolicyStatementFromLookup(scope: Construct): PolicyStatement {
    const secretsPrefix = StringParameter.valueFromLookup(
      scope,
      secretsManagerSecretsPrefixParameterName(this.infrastructureStackId)
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
    scope: Construct
  ): PolicyStatement {
    const nsArn = StringParameter.valueFromLookup(
      scope,
      namespaceArnParameterName(this.infrastructureStackId)
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
