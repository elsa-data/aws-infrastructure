import { aws_route53 as route53 } from "aws-cdk-lib";
import { StringParameter } from "aws-cdk-lib/aws-ssm";
import { IVpc, SecurityGroup, Vpc } from "aws-cdk-lib/aws-ec2";
import {
  HttpNamespace,
  IHttpNamespace,
} from "aws-cdk-lib/aws-servicediscovery";
import { Certificate, ICertificate } from "aws-cdk-lib/aws-certificatemanager";
import {
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

  public getEdgeDbSecurityGroupFromLookup(
    scope: Construct,
    databaseName: string
  ) {
    return SecurityGroup.fromSecurityGroupId(
      scope,
      "EdgeDbSecurityGroup",
      StringParameter.valueFromLookup(
        scope,
        `/${this.infrastructureStackId}/Database/${databaseName}/EdgeDb/securityGroupId`
      ),

      {
        // the client stacks where we use these security groups
        // should not ever edit the ingress/egress rules
        mutable: false,
      }
    );
  }
}
