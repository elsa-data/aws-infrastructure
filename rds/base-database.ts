import { Construct } from "constructs";
import { ISecurityGroup } from "aws-cdk-lib/aws-ec2";

/**
 * An abstract concept that helps us wrap the CDK concepts of
 * a RDS instance v a RDS cluster v RDS serverless - which
 * are all _basically_ the same from our perspective but are
 * different enough types in CDK that it is annoying.
 */
export abstract class BaseDatabase extends Construct {
  protected constructor(scope: Construct, id: string) {
    super(scope, id);
  }

  public abstract get dsnWithTokens(): string;

  public abstract get dsnNoPassword(): string;

  public abstract get hostname(): string;

  public abstract get port(): number;

  public abstract get securityGroup(): ISecurityGroup;
}
