# Elsa Data AWS Infrastructure

An infrastructure stack for Elsa Data - published as a pair of
`npm` packages - one for establishing the infrastructure, and the
other as a client CDK stack to lookup values via parameter store
lookup. See [README](packages/stack/README.md) for details.

## Create a Release

Create a tagged release in Github in order to publish the
pair of packages to `npmjs`. Use semantic versioning.

## Development

The infrastructure CDK can be developed by deploying the stack
from the `dev` folder. Note that the included package will use
the package `*.js` files - so the stack MUST be
compiled (`jsii`) before deployment (in both `client` and `stack`).
