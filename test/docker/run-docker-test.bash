#!/usr/bin/env bash

read -r -p "Enter node version [10|12]: " userInput
NODE_VERSION=$(echo $userInput | sed 's/v//g')
echo "Using node version $NODE_VERSION"

MSYS_NO_PATHCONV=1
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

docker run --rm -it \
  -v "$DIR/../..":/data \
  -v "$DIR/entrypoint.bash":/entrypoint.bash \
  --user "$(id -u):$(id -g)" \
  node:$NODE_VERSION bash 'entrypoint.bash'
