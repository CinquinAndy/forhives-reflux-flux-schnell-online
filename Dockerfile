# The image of the site: a Nuxt 3 single-page app served by Nitro (preset node-server).
#
# - Node 24 LTS, patched (24.22.1 fixes CVE-2026-111497, the Brotli decoder). The base image is
#   pinned by version AND digest: Renovate proposes the next one.
# - No secret and no database: the build needs nothing but the sources and the lockfile.
# - yarn.lock (classic) is the lockfile in use.

# 1. Build.
FROM node:24.22.1-bookworm-slim@sha256:55fb5f5a527ea2c5c4a95f963e48ef90aa38c7b346054fdc8ee9957a2b55d205 AS build
WORKDIR /app
RUN corepack enable && corepack prepare yarn@1.22.22 --activate
COPY package.json yarn.lock ./
# Scripts are skipped here: the `postinstall` of the project (`nuxt prepare`) needs the sources,
# and `nuxt build` below prepares them anyway.
RUN yarn install --frozen-lockfile --ignore-scripts
COPY . .
RUN yarn build

# 2. What runs: the Nitro output alone, it carries its own dependencies.
FROM node:24.22.1-bookworm-slim@sha256:55fb5f5a527ea2c5c4a95f963e48ef90aa38c7b346054fdc8ee9957a2b55d205 AS run
WORKDIR /app
ENV NODE_ENV=production PORT=3000 NITRO_PORT=3000 HOST=0.0.0.0 NITRO_HOST=0.0.0.0
COPY --from=build --chown=node:node /app/.output ./.output
# Never root: `node` is the unprivileged user of the base image.
USER node
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
