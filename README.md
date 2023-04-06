# Infrastructure for Elsa Data

A generally usable infrastructure stack that should be
deployed directly to an account - though the set of service it offers
is mainly of interest to a deployment of Elsa Data (i.e it only
offers setting up a Postgres db).

## Use

The infrastructure stack name can be used in 'application' stacks
allowing them to import from parameter store all the base level
settings needed.

## Included

Infrastructure includes

- an optional VPC (or re-use an existing one)
- a RDS postgres instance
- a S3 bucket for temp objects
- a SSL wildcard certificate with connected DNS zone (re-using an existing one)

## Deployment

This repo currently has settings for manual deployment to

- UMCCR dev `npx cdk deploy ElsaDataAustralianGenomicsInfrastructureStack`
- Australian Genomics `npx cdk deploy ElsaDataAustralianGenomicsInfrastructureStack`
