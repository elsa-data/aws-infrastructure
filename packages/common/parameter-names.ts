export function vpcIdParameterName(infrastructureStackId: string) {
  return `/${infrastructureStackId}/VPC/vpcId`;
}

export function vpcAvailabilityZonesParameterName(
  infrastructureStackId: string,
) {
  return `/${infrastructureStackId}/VPC/availabilityZones`;
}

export function vpcPublicSubnetIdsParameterName(infrastructureStackId: string) {
  return `/${infrastructureStackId}/VPC/publicSubnetIds`;
}

export function vpcPublicSubnetRouteTableIdsParameterName(
  infrastructureStackId: string,
) {
  return `/${infrastructureStackId}/VPC/publicSubnetRouteTableIds`;
}

export function vpcPrivateSubnetIdsParameterName(
  infrastructureStackId: string,
) {
  return `/${infrastructureStackId}/VPC/privateSubnetIds`;
}

export function vpcPrivateSubnetRouteTableIdsParameterName(
  infrastructureStackId: string,
) {
  return `/${infrastructureStackId}/VPC/privateSubnetRouteTableIds`;
}

export function vpcIsolatedSubnetIdsParameterName(
  infrastructureStackId: string,
) {
  return `/${infrastructureStackId}/VPC/isolatedSubnetIds`;
}

export function vpcIsolatedSubnetRouteTableIdsParameterName(
  infrastructureStackId: string,
) {
  return `/${infrastructureStackId}/VPC/isolatedSubnetRouteTableIds`;
}

export function vpcSecurityGroupIdParameterName(infrastructureStackId: string) {
  return `/${infrastructureStackId}/VPC/securityGroupId`;
}

export function vpcInternalSecurityGroupIdParameterName(
  infrastructureStackId: string,
) {
  return `/${infrastructureStackId}/VPC/internalSecurityGroupId`;
}

export function secretsManagerSecretsPrefixParameterName(
  infrastructureStackId: string,
) {
  return `/${infrastructureStackId}/SecretsManager/secretsPrefix`;
}

export function namespaceNameParameterName(infrastructureStackId: string) {
  return `/${infrastructureStackId}/HttpNamespace/namespaceName`;
}

export function namespaceIdParameterName(infrastructureStackId: string) {
  return `/${infrastructureStackId}/HttpNamespace/namespaceId`;
}

export function namespaceArnParameterName(infrastructureStackId: string) {
  return `/${infrastructureStackId}/HttpNamespace/namespaceArn`;
}

export function databaseEdgeDbDsnNoPasswordOrDatabaseParameterName(
  infrastructureStackId: string,
  dbName: string,
) {
  return `/${infrastructureStackId}/Database/${dbName}/EdgeDb/dsnNoPasswordOrDatabase`;
}

export function databaseEdgeDbAdminPasswordSecretArnParameterName(
  infrastructureStackId: string,
  dbName: string,
) {
  return `/${infrastructureStackId}/Database/${dbName}/EdgeDb/adminPasswordSecretArn`;
}

export function databaseEdgeDbSecurityGroupIdParameterName(
  infrastructureStackId: string,
  dbName: string,
) {
  return `/${infrastructureStackId}/Database/${dbName}/EdgeDb/securityGroupId`;
}
