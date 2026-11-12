#!/usr/bin/env bash
# Hans' vurderinger fra guiden via MCP-verktøyet list_vurderinger.
# Bruk: mise run vurderinger [--alle] [--siden ISO] [--nye] [--prefiks P]
set -euo pipefail
URL=${MCP_URL:-http://localhost:3000/mcp}
TOKEN=${MCP_TOKEN:-parenttoken1}
SIST=${XDG_CACHE_HOME:-$HOME/.cache}/nissekomm/vurderinger-sist
args='{}'
while [[ $# -gt 0 ]]; do
  case $1 in
    --alle) args=$(jq -c '.status="alle"' <<<"$args") ;;
    --siden) args=$(jq -c --arg v "$2" '.siden=$v' <<<"$args"); shift ;;
    --prefiks) args=$(jq -c --arg v "$2" '.prefiks=$v' <<<"$args"); shift ;;
    --nye) [[ -f $SIST ]] && args=$(jq -c --arg v "$(cat "$SIST")" '.siden=$v' <<<"$args") ;;
    *) echo "ukjent: $1" >&2; exit 2 ;;
  esac
  shift
done
start=$(date -u +%FT%TZ)
body=$(jq -nc --argjson a "$args" '{jsonrpc:"2.0",id:1,method:"tools/call",params:{name:"list_vurderinger",arguments:$a}}')
svar=$(curl -fsS "$URL" -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' -d "$body" | sed -n 's/^data: //;/^{/p')
jq -er 'if .error then error(.error.message) elif .result.isError then error(.result.content[0].text) else .result.content[0].text end' <<<"$svar"
mkdir -p "$(dirname "$SIST")" && echo "$start" >"$SIST"
