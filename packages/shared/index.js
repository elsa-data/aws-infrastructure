// we share techniques for constructing parameter names between the client and stack

function vpcIdParameterName(infrastructureStackId) {
  return `/${infrastructureStackId}/VPC/vpcId`;
}

function vpcAvailabilityZonesParameterName(infrastructureStackId) {
  return `/${infrastructureStackId}/VPC/availabilityZones`;
}

function vpcPublicSubnetIdsParameterName(infrastructureStackId) {
  return `/${infrastructureStackId}/VPC/publicSubnetIds`;
}

function vpcPublicSubnetRouteTableIdsParameterName(infrastructureStackId) {
  return `/${infrastructureStackId}/VPC/publicSubnetRouteTableIds`;
}

function vpcPrivateSubnetIdsParameterName(infrastructureStackId) {
  return `/${infrastructureStackId}/VPC/privateSubnetIds`;
}

function vpcPrivateSubnetRouteTableIdsParameterName(infrastructureStackId) {
  return `/${infrastructureStackId}/VPC/privateSubnetRouteTableIds`;
}

function vpcIsolatedSubnetIdsParameterName(infrastructureStackId) {
  return `/${infrastructureStackId}/VPC/isolatedSubnetIds`;
}

function vpcIsolatedSubnetRouteTableIdsParameterName(infrastructureStackId) {
  return `/${infrastructureStackId}/VPC/isolatedSubnetRouteTableIds`;
}

function vpcSecurityGroupIdParameterName(infrastructureStackId) {
  return `/${infrastructureStackId}/VPC/securityGroupId`;
}

function vpcInternalSecurityGroupIdParameterName(infrastructureStackId) {
  return `/${infrastructureStackId}/VPC/internalSecurityGroupId`;
}

function secretsManagerSecretsPrefixParameterName(infrastructureStackId) {
  return `/${infrastructureStackId}/SecretsManager/secretsPrefix`;
}

function namespaceNameParameterName(infrastructureStackId) {
  return `/${infrastructureStackId}/HttpNamespace/namespaceName`;
}

function namespaceIdParameterName(infrastructureStackId) {
  return `/${infrastructureStackId}/HttpNamespace/namespaceId`;
}

function namespaceArnParameterName(infrastructureStackId) {
  return `/${infrastructureStackId}/HttpNamespace/namespaceArn`;
}

function databaseEdgeDbDsnNoPasswordOrDatabaseParameterName(
  infrastructureStackId,
  dbName
) {
  return `/${infrastructureStackId}/Database/${dbName}/EdgeDb/dsnNoPasswordOrDatabase`;
}

function databaseEdgeDbAdminPasswordSecretArnParameterName(
  infrastructureStackId,
  dbName
) {
  return `/${infrastructureStackId}/Database/${dbName}/EdgeDb/adminPasswordSecretArn`;
}

function databaseEdgeDbSecurityGroupIdParameterName(
  infrastructureStackId,
  dbName
) {
  return `/${infrastructureStackId}/Database/${dbName}/EdgeDb/securityGroupId`;
}

module.exports = {
  vpcIdParameterName,
  vpcAvailabilityZonesParameterName,
  vpcPublicSubnetIdsParameterName,
  vpcPublicSubnetRouteTableIdsParameterName,
  vpcPrivateSubnetIdsParameterName,
  vpcPrivateSubnetRouteTableIdsParameterName,
  vpcIsolatedSubnetIdsParameterName,
  vpcIsolatedSubnetRouteTableIdsParameterName,
  vpcSecurityGroupIdParameterName,
  vpcInternalSecurityGroupIdParameterName,
  secretsManagerSecretsPrefixParameterName,
  namespaceNameParameterName,
  namespaceIdParameterName,
  namespaceArnParameterName,
  databaseEdgeDbDsnNoPasswordOrDatabaseParameterName,
  databaseEdgeDbAdminPasswordSecretArnParameterName,
  databaseEdgeDbSecurityGroupIdParameterName,
};
