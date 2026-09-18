# brawndo.gov on Cloud Run. The project id is public (it is in the submission) and baked in at build time,
# because Next.js inlines NEXT_PUBLIC_* during `next build`. Deploy: gcloud run deploy --source web ...
FROM node:24-slim AS build
WORKDIR /app
ARG NEXT_PUBLIC_SANITY_PROJECT_ID=ukyhb6bu
ARG NEXT_PUBLIC_SANITY_DATASET=production
ENV NEXT_PUBLIC_SANITY_PROJECT_ID=$NEXT_PUBLIC_SANITY_PROJECT_ID NEXT_PUBLIC_SANITY_DATASET=$NEXT_PUBLIC_SANITY_DATASET
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build

FROM node:24-slim
WORKDIR /app
ENV NODE_ENV=production PORT=8080 HOSTNAME=0.0.0.0
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
EXPOSE 8080
# SANITY_VOTE_TOKEN is injected at runtime (Secret Manager), never baked into the image.
CMD ["node", "server.js"]
