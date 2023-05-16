import { aws_ec2 as ec2 } from "aws-cdk-lib";
import { Construct } from "constructs";
import { FargateService } from "aws-cdk-lib/aws-ecs";
import {
  HealthCheck,
  NetworkLoadBalancer,
  Protocol,
  SslPolicy,
} from "aws-cdk-lib/aws-elasticloadbalancingv2";
import { ICertificate } from "aws-cdk-lib/aws-certificatemanager";
import { ARecord, IHostedZone, RecordTarget } from "aws-cdk-lib/aws-route53";
import { SubnetType } from "aws-cdk-lib/aws-ec2";
import { LoadBalancerTarget } from "aws-cdk-lib/aws-route53-targets";

export type EdgeDbLoadBalancerPassthroughProps = {
  // whether the load balancer for this EdgeDb should face the internet and be public
  // note that the load balancer can be made public internet *without* also specifying
  // a TLS name - in which case it will just be using an internal AWS name
  internetFacing: boolean;

  // the port that the load balancer will listen on for TCP passthrough work - this is the normal
  // way for interacting with EdgeDb (i.e. edgedb:// protocol)
  tcpPassthroughPort: number;

  // optionally specify to listen with TLS termination
  // e.g this can then forward through to the UI (https://<tls.prefix>.<tls.zone>:<port>/ui -> https://<fargate>/ui)
  tls?: {
    port: number;
    hostedPrefix: string;
    hostedZone: IHostedZone;
    hostedCertificate: ICertificate;
  };

  // the service health check (if defined)
  serviceHealthCheck?: HealthCheck;
};

type EdgeDbLoadBalancerProps = EdgeDbLoadBalancerPassthroughProps & {
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
export class EdgeDbLoadBalancerConstruct extends Construct {
  private readonly _lb: NetworkLoadBalancer;
  private readonly _dns: string;

  constructor(scope: Construct, id: string, props: EdgeDbLoadBalancerProps) {
    super(scope, id);

    this._lb = new NetworkLoadBalancer(this, "LoadBalancer", {
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: props.internetFacing
          ? SubnetType.PUBLIC
          : SubnetType.PRIVATE_WITH_EGRESS,
      },
      internetFacing: props.internetFacing,
    });

    // we default to using the load balancer internal DNS name - and only switch on real DNS
    // if needed later
    this._dns = this._lb.loadBalancerDnsName;

    // the main required load balancer is TCP traffic that comes in
    // that we relay directly to the EdgeDb service (where it does it own TLS layer)
    {
      const tcpListener = this._lb.addListener("TcpListener", {
        port: props.tcpPassthroughPort,
        protocol: Protocol.TCP,
      });

      const tg = tcpListener.addTargets("TcpTargetGroup", {
        port: props.servicePort,
        protocol: Protocol.TCP,
        targets: [props.service],
      });

      // configure healthcheck if given
      if (props.serviceHealthCheck)
        tg.configureHealthCheck(props.serviceHealthCheck);
    }

    // optionally we can also set up another port where the NLB will terminate TLS for us
    // (in which case we also need to setup DNS for the load balancer)
    if (props.tls) {
      if (!props.internetFacing) {
        throw new Error(
          "It is an error to specify TLS termination for the EdgeDb network load balancer if the balancer is not internet facing"
        );
      }

      new ARecord(this, "DNS", {
        zone: props.tls.hostedZone,
        recordName: props.tls.hostedPrefix,
        target: RecordTarget.fromAlias(new LoadBalancerTarget(this._lb)),
      });

      // prefer to use the proper name for referring to our NLB rather than the internal NLB name
      this._dns = `${props.tls.hostedPrefix}.${props.tls.hostedZone.zoneName}`;

      const tlsListener = this._lb.addListener("TlsListener", {
        port: props.tls.port,
        certificates: [props.tls.hostedCertificate],
        // this is the protocol coming _into_ the network load balancer - we will terminate
        // the TLS with our hostedCertificate
        protocol: Protocol.TLS,
        sslPolicy: SslPolicy.RECOMMENDED,
      });

      const tg = tlsListener.addTargets("TlsTargetGroup", {
        port: props.servicePort,
        // this is the protocol going _out_ to the fargate service
        // note we can forward to a TLS target with self-signed certs (like EdgeDb) because network load balancer
        // supports this even if we don't have the full cert chain etc
        protocol: Protocol.TLS,
        targets: [props.service],
      });

      tg.setAttribute("preserve_client_ip.enabled", "true");
      //tg.setAttribute("proxy_protocol_v2.enabled", "true");
      //tg.setAttribute("deregistration_delay.connection_termination.enabled", "true");

      // recommended to speed up ECS deployments
      // https://docs.aws.amazon.com/AmazonECS/latest/bestpracticesguide/load-balancer-connection-draining.html
      tg.setAttribute("deregistration_delay.timeout_seconds", "15");
    }
  }

  public get loadBalancer(): NetworkLoadBalancer {
    return this._lb;
  }

  public get dnsName(): string {
    return this._dns;
  }
}
