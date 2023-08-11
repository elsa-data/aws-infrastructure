import { aws_route53 as route53, Stack } from "aws-cdk-lib";
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

export interface DnsResult {
  readonly hostedZone: IHostedZone;
  readonly certificate: ICertificate;
}

export class ElsaDataInfrastructureClient {
  public createVpcFromLookup(
    stack: Stack,
    infrastructureStackId: string
  ): IVpc {
    const getStringListLookup = (parameterName: string) => {
      return StringParameter.valueFromLookup(stack, parameterName).split(",");
    };

    return Vpc.fromVpcAttributes(stack, "VPC", {
      vpcId: StringParameter.valueFromLookup(
        stack,
        vpcIdParameterName(infrastructureStackId)
      ),
      availabilityZones: getStringListLookup(
        vpcAvailabilityZonesParameterName(infrastructureStackId)
      ),
      publicSubnetIds: getStringListLookup(
        vpcPublicSubnetIdsParameterName(infrastructureStackId)
      ),
      publicSubnetRouteTableIds: getStringListLookup(
        vpcPublicSubnetRouteTableIdsParameterName(infrastructureStackId)
      ),
      privateSubnetIds: getStringListLookup(
        vpcPrivateSubnetIdsParameterName(infrastructureStackId)
      ),
      privateSubnetRouteTableIds: getStringListLookup(
        vpcPrivateSubnetRouteTableIdsParameterName(infrastructureStackId)
      ),
      isolatedSubnetIds: getStringListLookup(
        vpcIsolatedSubnetIdsParameterName(infrastructureStackId)
      ),
      isolatedSubnetRouteTableIds: getStringListLookup(
        vpcIsolatedSubnetRouteTableIdsParameterName(infrastructureStackId)
      ),
    });
  }

  /**
   * Create a useable CloudMap namespace object by reflecting values
   * out of Parameter Store.
   *
   * @param stack
   * @param infrastructureStackId
   */
  public createNamespaceFromLookup(
    stack: Stack,
    infrastructureStackId: string
  ): IHttpNamespace {
    return HttpNamespace.fromHttpNamespaceAttributes(stack, "Namespace", {
      namespaceArn: StringParameter.valueFromLookup(
        stack,
        `/${infrastructureStackId}/HttpNamespace/namespaceArn`
      ),
      namespaceId: StringParameter.valueFromLookup(
        stack,
        `/${infrastructureStackId}/HttpNamespace/namespaceId`
      ),
      namespaceName: StringParameter.valueFromLookup(
        stack,
        `/${infrastructureStackId}/HttpNamespace/namespaceName`
      ),
    });
  }

  /**
   * Create some useable DNS CDK objects by reflecting values out of Parameter
   * Store.
   *
   * @param stack
   * @param infrastructureStackId
   */
  public createDnsFromLookup(
    stack: Stack,
    infrastructureStackId: string
  ): DnsResult {
    const hostedZone = route53.HostedZone.fromHostedZoneAttributes(
      stack,
      "HostedZone",
      {
        hostedZoneId: StringParameter.valueFromLookup(
          stack,
          `/${infrastructureStackId}/HostedZone/hostedZoneId`
        ),
        zoneName: StringParameter.valueFromLookup(
          stack,
          `/${infrastructureStackId}/HostedZone/zoneName`
        ),
      }
    );

    const certificate = Certificate.fromCertificateArn(
      stack,
      "SslCert",
      StringParameter.valueFromLookup(
        stack,
        `/${infrastructureStackId}/Certificate/certificateArn`
      )
    );

    return {
      hostedZone,
      certificate,
    };
  }

  public createEdgeDbSecurityGroupFromLookup(
    stack: Stack,
    infrastructureStackId: string,
    databaseName: string
  ) {
    return SecurityGroup.fromSecurityGroupId(
      stack,
      "EdgeDbSecurityGroup",
      StringParameter.valueFromLookup(
        stack,
        `/${infrastructureStackId}/Database/${databaseName}/EdgeDb/securityGroupId`
      ),

      {
        // the client stacks where we use these security groups
        // should not ever edit the ingress/egress rules
        mutable: false,
      }
    );
  }
}
