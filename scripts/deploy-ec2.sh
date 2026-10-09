#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 2 ]]; then
  printf 'Uso: %s ec2-user@IP /caminho/da/chave-ssh\n' "$0" >&2
  exit 2
fi

target=$1
key=$2
image=whatsapp-everyone-bot-bot:latest
ssh_options=(-i "$key" -o IdentitiesOnly=yes)
if [[ -n "${BOT_KNOWN_HOSTS_FILE:-}" ]]; then
  ssh_options+=(-o UserKnownHostsFile="$BOT_KNOWN_HOSTS_FILE")
fi

if [[ ! -f "$key" ]]; then
  printf 'Chave SSH não encontrada: %s\n' "$key" >&2
  exit 2
fi

cd "$(dirname "$0")/.."
docker build -t "$image" .
archive=$(mktemp /tmp/sticker-bot-image.XXXXXX.tar.gz)
trap 'rm -f "$archive"' EXIT
docker save "$image" | gzip -1 > "$archive"
scp "${ssh_options[@]}" "$archive" "$target:sticker-bot-image.tar.gz"

ssh "${ssh_options[@]}" "$target" 'bash -s' <<'REMOTE'
set -euo pipefail
gzip -dc ~/sticker-bot-image.tar.gz | sudo docker load
rm ~/sticker-bot-image.tar.gz
sudo docker volume create sticker_session >/dev/null
if sudo docker container inspect sticker-bot >/dev/null 2>&1; then
  sudo docker rm -f sticker-bot >/dev/null
fi
sudo docker run -d --name sticker-bot --restart on-failure --init \
  -v sticker_session:/data \
  --log-opt max-size=10m --log-opt max-file=3 \
  whatsapp-everyone-bot-bot:latest
sudo docker ps --filter name=sticker-bot --format '{{.Names}} {{.Status}}'
REMOTE
