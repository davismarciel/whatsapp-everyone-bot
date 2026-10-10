#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 2 ]]; then
  printf 'Uso: %s ec2-user@IP /caminho/da/chave-ssh\n' "$0" >&2
  exit 2
fi

target=$1
key=$2
ssh_options=(-i "$key" -o IdentitiesOnly=yes)
if [[ -n "${BOT_KNOWN_HOSTS_FILE:-}" ]]; then
  ssh_options+=(-o UserKnownHostsFile="$BOT_KNOWN_HOSTS_FILE")
fi

if [[ ! -f "$key" ]]; then
  printf 'Chave SSH não encontrada: %s\n' "$key" >&2
  exit 2
fi

ssh "${ssh_options[@]}" "$target" 'bash -s' <<'REMOTE'
set -euo pipefail

container=sticker-bot
if ! sudo docker container inspect "$container" >/dev/null 2>&1; then
  printf 'Contêiner %s não encontrado.\n' "$container" >&2
  exit 1
fi

volume=$(sudo docker inspect "$container" --format '{{range .Mounts}}{{if eq .Destination "/data"}}{{.Name}}{{end}}{{end}}')
image=$(sudo docker inspect "$container" --format '{{.Image}}')
if [[ -z "$volume" || -z "$image" ]]; then
  printf 'Não foi possível identificar o volume da sessão ou a imagem do bot.\n' >&2
  exit 1
fi

backup="session-before-relink-$(date -u +%Y%m%dT%H%M%SZ)"
sudo docker stop "$container" >/dev/null
restart_on_exit=true
trap 'if [[ "$restart_on_exit" == true ]]; then sudo docker start "$container" >/dev/null || true; fi' EXIT

sudo docker run --rm --user 0:0 --entrypoint sh -v "$volume:/data" "$image" \
  -eu -c 'test -d /data/session && test ! -e "/data/$1" && mv /data/session "/data/$1"' sh "$backup"

sudo docker start "$container" >/dev/null
restart_on_exit=false
printf 'Sessão anterior preservada: volume %s, diretório %s\n' "$volume" "$backup"
printf 'Escaneie o novo QR Code exibido nos logs. Ctrl-C encerra apenas a visualização.\n'
REMOTE

ssh "${ssh_options[@]}" "$target" 'sudo docker logs --since 60s -f sticker-bot'
