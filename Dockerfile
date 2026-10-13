# syntax=docker/dockerfile:1
FROM node:22-alpine AS builder

LABEL maintainer="株式会社世良 <info@sera-inc.co.jp>"

WORKDIR /opt/app

# Copy only the files needed to install dependencies and build the webpack bundle.
COPY package.json package-lock.json .babelrc ./
COPY bundle/ ./bundle/
COPY webpack/ ./webpack/
COPY bin/generateRandomString.js ./bin/
COPY lib/ ./lib/
COPY static/ ./static/
COPY views/ ./views/
COPY translations/ ./translations/
COPY server.js ./

# Install the full dependency tree, run the existing postinstall bundle build,
# then prune dev-only packages before copying artifacts into the runtime image.
RUN --mount=type=secret,id=local_ca \
  if [ -f /run/secrets/local_ca ]; then export NODE_EXTRA_CA_CERTS=/run/secrets/local_ca; fi; \
  npm ci --cache /tmp/empty-cache --omit=optional --force && \
  npm prune --omit=dev --omit=optional && \
  rm -rf /tmp/*

FROM node:22-alpine AS runtime

LABEL maintainer="株式会社世良 <info@sera-inc.co.jp>"

ENV NODE_ENV=production

WORKDIR /opt/app

COPY --chown=node:node package.json package-lock.json ./
COPY --chown=node:node LICENSE COPYRIGHT NOTICE ./
COPY --chown=node:node lib/ ./lib/
COPY --chown=node:node static/ ./static/
COPY --chown=node:node views/ ./views/
COPY --chown=node:node translations/ ./translations/
COPY --chown=node:node server.js ./
COPY --chown=node:node --from=builder /opt/app/node_modules ./node_modules

USER node
EXPOSE 1337

CMD ["node", "lib/server/server.js"]
