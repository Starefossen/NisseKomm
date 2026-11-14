#!/usr/bin/env bash
# Hans' vurderinger fra guiden via MCP-verktøyet list_vurderinger.
# Bruk: mise run vurderinger [--alle] [--siden ISO] [--nye] [--prefiks P] [--historikk ID]
#       mise run vurderinger --prioriter ID --grunn "…" [--hast] [--frist ISO] | --prioriter ID --fjern
#       mise run vurderinger --svar ID "tekst" | --arbeid ID "hva" | --arbeid ID --ferdig | --regler TYPE | --beslutninger [--alle]
#       mise run vurderinger --klientfeil   (feil fra skjermene, nyeste først)
# (AGENT_NAVN navngir agenten i historikken)
set -euo pipefail
URL=${MCP_URL:-http://localhost:3000/mcp}
TOKEN=${MCP_TOKEN:-parenttoken1}
if [[ ${1:-} == --klientfeil ]]; then
  curl -fsS "${URL%/mcp}/api/klientfeil" -H "Authorization: Bearer $TOKEN" |
    jq -r '.[] | "\(.tid) \(.rolle) \(.rute)  \(.melding)  [\(.ua[0:60])]"'
  exit
fi
SIST=${XDG_CACHE_HOME:-$HOME/.cache}/nissekomm/vurderinger-sist
args='{}'
tool=list_vurderinger
nye=0 filter=0
while [[ $# -gt 0 ]]; do
  case $1 in
    --alle) args=$(jq -c '.status="alle"' <<<"$args") ;;
    --siden) filter=1; args=$(jq -c --arg v "$2" '.siden=$v' <<<"$args"); shift ;;
    --prefiks) filter=1; args=$(jq -c --arg v "$2" '.prefiks=$v' <<<"$args"); shift ;;
    --historikk) filter=1; args=$(jq -c --arg v "$2" '.historikk=$v' <<<"$args"); shift ;;
    --nye) nye=1; [[ -f $SIST ]] && args=$(jq -c --arg v "$(cat "$SIST")" '.siden=$v' <<<"$args") ;;
    --prioriter) tool=prioriter_vurdering; args=$(jq -c --arg v "$2" --arg a "${AGENT_NAVN:-cli}" '.id=$v|.av=$a' <<<"$args"); shift ;;
    --grunn) args=$(jq -c --arg v "$2" '.grunn=$v' <<<"$args"); shift ;;
    --frist) args=$(jq -c --arg v "$2" '.frist=$v' <<<"$args"); shift ;;
    --hast) args=$(jq -c '.nivaa="hast"' <<<"$args") ;;
    --fjern) args=$(jq -c '.fjern=true' <<<"$args") ;;
    --svar) tool=svar_vurdering; args=$(jq -c --arg v "$2" --arg t "${3:-}" --arg a "${AGENT_NAVN:-cli}" '.id=$v|.tekst=$t|.av=$a' <<<"$args"); shift 2 ;;
    --arbeid)
      tool=arbeid_vurdering; args=$(jq -c --arg v "$2" --arg a "${AGENT_NAVN:-cli}" '.id=$v|.av=$a' <<<"$args"); shift
      if [[ $# -gt 1 && $2 != --* ]]; then args=$(jq -c --arg t "$2" '.hva=$t' <<<"$args"); shift; fi ;;
    --ferdig) args=$(jq -c '.ferdig=true' <<<"$args") ;;
    --beslutninger) tool=list_beslutninger ;;
    --regler) tool=regler_vurdering; args=$(jq -c --arg v "$2" '.type=$v' <<<"$args"); shift ;;
    *) echo "ukjent: $1" >&2; exit 2 ;;
  esac
  shift
done
start=$(date -u +%FT%TZ)
body=$(jq -nc --arg t "$tool" --argjson a "$args" '{jsonrpc:"2.0",id:1,method:"tools/call",params:{name:$t,arguments:$a}}')
svar=$(curl -fsS "$URL" -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' -d "$body" | sed -n 's/^data: //;/^{/p')
jq -er 'if .error then error(.error.message) elif .result.isError then error(.result.content[0].text) else .result.content[0].text end' <<<"$svar"
# Only a plain --nye run has seen everything new; a filtered one must not move the marker.
if [[ $nye == 1 && $filter == 0 ]]; then mkdir -p "$(dirname "$SIST")" && echo "$start" >"$SIST"; fi
