
all:
	(cd stack; npm run build)
	(cd client; npm run build-client)

install:
	(cd client; npm ci)
	(cd dev; npm ci)
	(cd shared; npm ci)
	(cd stack; npm ci)

clean:
	(cd shared; rm -rf .jsii tsconfig.json tsconfig.tsbuildinfo dist)
	(cd stack; rm -rf .jsii tsconfig.json tsconfig.tsbuildinfo dist)
	(cd client; rm -rf .jsii tsconfig.json tsconfig.tsbuildinfo dist)

nuke:
	(cd dev; rm -rf cdk.out)
