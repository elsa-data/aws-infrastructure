export function vpcIdParameterName(infrastructureStackId: string): string;

export function vpcAvailabilityZonesParameterName(
  infrastructureStackId: string
): string;

export function vpcPublicSubnetIdsParameterName(
  infrastructureStackId: string
): string;

export function vpcPublicSubnetRouteTableIdsParameterName(
  infrastructureStackId: string
): string;

export function vpcPrivateSubnetIdsParameterName(
  infrastructureStackId: string
): string;

export function vpcPrivateSubnetRouteTableIdsParameterName(
  infrastructureStackId: string
): string;

export function vpcIsolatedSubnetIdsParameterName(
  infrastructureStackId: string
): string;

export function vpcIsolatedSubnetRouteTableIdsParameterName(
  infrastructureStackId: string
): string;

export function vpcSecurityGroupIdParameterName(
  infrastructureStackId: string
): string;

export function vpcInternalSecurityGroupIdParameterName(
  infrastructureStackId: string
): string;

export function secretsManagerSecretsPrefixParameterName(
  infrastructureStackId: string
): string;

export function namespaceNameParameterName(
  infrastructureStackId: string
): string;

export function namespaceIdParameterName(infrastructureStackId: string): string;

export function namespaceArnParameterName(
  infrastructureStackId: string
): string;

export function databaseEdgeDbDsnNoPasswordOrDatabaseParameterName(
  infrastructureStackId: string,
  dbName: string
): string;

export function databaseEdgeDbAdminPasswordSecretArnParameterName(
  infrastructureStackId: string,
  dbName: string
): string;

export function databaseEdgeDbSecurityGroupIdParameterName(
  infrastructureStackId: string,
  dbName: string
): string;
