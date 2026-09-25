# syntax=docker/dockerfile:1

ARG GO_VERSION=1.27
FROM golang:${GO_VERSION}-alpine AS build

WORKDIR /src

COPY go.mod ./
RUN go mod download

COPY . .

ARG VERSION=dev
ARG COMMIT=unknown

RUN CGO_ENABLED=0 go build \
    -trimpath \
    -ldflags "-s -w -X main.version=${VERSION} -X main.commit=${COMMIT}" \
    -o /out/aegisora-sidecar \
    ./cmd/aegisora-sidecar

FROM gcr.io/distroless/static-debian12:nonroot

COPY --from=build /out/aegisora-sidecar /aegisora-sidecar

ENV AEGISORA_SIDECAR_HTTP_ADDRESS=0.0.0.0:8081

EXPOSE 8081

ENTRYPOINT ["/aegisora-sidecar"]
