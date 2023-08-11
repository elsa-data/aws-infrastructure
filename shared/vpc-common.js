// we share techniques for constructing parameter names between the client and stack

export function vpcIdParameterName(infrastructureStackId) {
  return `/${infrastructureStackId}/VPC/vpcId`;
}

export function vpcAvailabilityZonesParameterName(infrastructureStackId) {
  return `/${infrastructureStackId}/VPC/availabilityZones`;
}

export function vpcPublicSubnetIdsParameterName(infrastructureStackId) {
  return `/${infrastructureStackId}/VPC/publicSubnetIds`;
}

export function vpcPublicSubnetRouteTableIdsParameterName(
  infrastructureStackId
) {
  return `/${infrastructureStackId}/VPC/publicSubnetRouteTableIds`;
}

export function vpcPrivateSubnetIdsParameterName(infrastructureStackId) {
  return `/${infrastructureStackId}/VPC/privateSubnetIds`;
}

export function vpcPrivateSubnetRouteTableIdsParameterName(
  infrastructureStackId
) {
  return `/${infrastructureStackId}/VPC/privateSubnetRouteTableIds`;
}

export function vpcIsolatedSubnetIdsParameterName(infrastructureStackId) {
  return `/${infrastructureStackId}/VPC/isolatedSubnetIds`;
}

export function vpcIsolatedSubnetRouteTableIdsParameterName(
  infrastructureStackId
) {
  return `/${infrastructureStackId}/VPC/isolatedSubnetRouteTableIds`;
}

export function vpcSecurityGroupIdParameterName(infrastructureStackId) {
  return `/${id}/VPC/securityGroupId`;
}

export function vpcInternalSecurityGroupIdParameterName(infrastructureStackId) {
  return `/${id}/VPC/internalSecurityGroupId`;
}
