FROM node:12-alpine

WORKDIR /app

COPY package.json .
COPY yarn.lock .

RUN yarn install --frozen-lockfile

COPY . .

# Build-time variables for the frontend
ARG SENTRY_DSN
ENV SENTRY_DSN=$SENTRY_DSN

ARG SENTRY_TOKEN
ENV SENTRY_TOKEN=$SENTRY_TOKEN

ARG MATOMO_URL
ENV MATOMO_URL=$MATOMO_URL

ARG MATOMO_SITE_ID
ENV MATOMO_SITE_ID=$MATOMO_SITE_ID

ARG POSTGRES_HOST
ENV POSTGRES_HOST=$POSTGRES_HOST

ARG JWT_SECRET
ENV JWT_SECRET=$JWT_SECRET

ARG TEST_CURRENT_DATE
ENV TEST_CURRENT_DATE=$TEST_CURRENT_DATE

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN yarn build && yarn --production

USER node

CMD ["yarn", "start"]