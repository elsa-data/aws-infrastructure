import { aws_ec2 as ec2, Duration } from "aws-cdk-lib";
import { Construct } from "constructs";
import { FargateService } from "aws-cdk-lib/aws-ecs";
import {
  NetworkLoadBalancer,
  Protocol,
  SslPolicy,
} from "aws-cdk-lib/aws-elasticloadbalancingv2";
import { ICertificate } from "aws-cdk-lib/aws-certificatemanager";
import { ARecord, IHostedZone, RecordTarget } from "aws-cdk-lib/aws-route53";
import { SubnetType } from "aws-cdk-lib/aws-ec2";
import { LoadBalancerTarget } from "aws-cdk-lib/aws-route53-targets";

export type EdgeDbLoadBalancerUiPassthroughProps = {
  hostedPort: number;
  hostedPrefix: string;
  hostedZone: IHostedZone;
  hostedCertificate: ICertificate;
};

type Props = EdgeDbLoadBalancerUiPassthroughProps & {
  // the VPC that the load balancer back side will live in
  vpc: ec2.IVpc;

  // the service we will balance to
  service: FargateService;

  // the service port we will balance to
  servicePort: number;
};

/**
 * A network load balancer that can sit in front of a Fargate EdgeDb service.
 */
export class EdgeDbLoadBalancerUiConstruct extends Construct {
  private readonly _lb: NetworkLoadBalancer;
  private readonly _dns: string;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    this._lb = new NetworkLoadBalancer(this, "LoadBalancerUi", {
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: SubnetType.PUBLIC,
      },
      internetFacing: true,
    });

    const tlsListener = this._lb.addListener("TlsListener", {
      // this is the port we are listening to for UI traffic
      port: props.hostedPort,
      // this is the protocol coming _into_ the network load balancer - for the UI we will terminate
      // the TLS with our hostedCertificate
      protocol: Protocol.TLS,
      certificates: [props.hostedCertificate],
      sslPolicy: SslPolicy.RECOMMENDED,
    });

    const tg = tlsListener.addTargets("TlsTargetGroup", {
      // this is the protocol going _out_ to the fargate service
      // note we can forward to a TLS target with self-signed certs (like EdgeDb) because network load balancer
      // supports this even if we don't have the full cert chain etc
      protocol: Protocol.TLS,
      // and the port we are connecting to on the fargate service
      port: props.servicePort,
      targets: [props.service],
      deregistrationDelay: Duration.seconds(15),
    });

    tg.configureHealthCheck({
      enabled: true,
      interval: Duration.minutes(1),
      healthyThresholdCount: 2,
      unhealthyThresholdCount: 2,
    });

    // THIS NEEDS TO *NOT* BE ENABLED. IF CLIENT IPS ARE PRESERVED THEN OUR
    // SECURITY GROUP FOR THE SERVICE NEEDS TO INCLUDE THE CLIENT IP LIST - WHERE
    // WHAT WE WANT IT TO BE IS JUST OUR VPC CIDR
    tg.setAttribute("preserve_client_ip.enabled", "false");

    new ARecord(this, "DNS", {
      zone: props.hostedZone,
      recordName: props.hostedPrefix,
      target: RecordTarget.fromAlias(new LoadBalancerTarget(this._lb)),
    });

    // our ALB DNS
    this._dns = `${props.hostedPrefix}.${props.hostedZone.zoneName}`;
  }

  public get dnsName(): string {
    return this._dns;
  }
}
