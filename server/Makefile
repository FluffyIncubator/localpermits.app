.PHONY: all

all:
	CGO_ENABLED=0 \
		GOOS="linux" \
		GOARCH="amd64" \
		go build \
			-o ./bin/server_linux_amd64 \
			./cmd/server/main.go