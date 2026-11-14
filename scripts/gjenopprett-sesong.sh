#!/usr/bin/env bash
# Gjenoppretter all fremdrift fra en kopi i serverarkivet (koder også).
# Serveren tar først en kopi av dagens fremdrift, så det kan angres.
# Bruk: mise run gjenopprett-sesong            (viser kopiene)
#       mise run gjenopprett-sesong --snapshot <id>
# BASE_URL, MCP_TOKEN
set -euo pipefail
BASE=${BASE_URL:-http://localhost:3000}
TOKEN=${MCP_TOKEN:-parenttoken1}
if [[ ${1:-} != --snapshot || -z ${2:-} ]]; then
  curl -fsS "$BASE/api/state/gjenopprett" -H "Authorization: Bearer $TOKEN" |
    jq -r '.[] | "\(.id)\t\(.arkivert)\t\(.grunn)\tsesong \(.sesong)\t\(.["nøkler"]) nøkler\t\(.brev) brev"'
  echo "Gjenopprett med: mise run gjenopprett-sesong --snapshot <id>" >&2
  exit 0
fi
curl -fsS -X POST "$BASE/api/state/gjenopprett" -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$(jq -nc --argjson id "$2" '{id: $id, bekreft: "GJENOPPRETT"}')" | jq .
