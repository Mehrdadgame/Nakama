FROM node:alpine AS node-builder

WORKDIR /backend

COPY package*.json .
RUN npm install

COPY tsconfig.json .
COPY main.ts .
RUN npx tsc

RUN go build --trimpath --mod=vendor --buildmode=plugin -o ./backend.so

FROM registry.heroiclabs.com/heroiclabs/nakama:3.9.0

COPY --from=builder /backend/backend.so /nakama/data/modules
COPY --from=node-builder /backend/build/*.js /nakama/data/modules/build/
COPY --from=builder /backend/build/*.js /nakama/data/modules/build/
COPY --from=builder /backend/local.yml /nakama/data/

COPY local.yml .