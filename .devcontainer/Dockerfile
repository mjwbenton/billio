FROM mcr.microsoft.com/devcontainers/typescript-node:24-bookworm

# Install PostgreSQL client (useful for local DSQL debugging)
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends postgresql-client \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Ensure Yarn Classic is active (the repo uses Yarn 1)
# Pin the exact version from package.json's packageManager field so it's
# pre-cached and Corepack never needs to download (and prompt) at runtime.
RUN corepack enable && corepack prepare yarn@1.22.19 --activate
