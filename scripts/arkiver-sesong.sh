#!/usr/bin/env bash
# Manuelt sesongarkiv: ber serveren ta en kopi (kv_arkiv) og legger kopien og
# minnene i MEDIA_DIR/_arkiv/<dato>/, så iCloud-speilet får dem.
# Bruk: mise run arkiver-sesong   (BASE_URL, MCP_TOKEN, MEDIA_DIR)
set -euo pipefail
BASE=${BASE_URL:-http://localhost:3000}
TOKEN=${MCP_TOKEN:-parenttoken1}
MEDIA=${MEDIA_DIR:-$(cd "$(dirname "$0")/.." && pwd)/public}
svar=$(curl -fsS -X POST "$BASE/api/state/arkiv" -H "Authorization: Bearer $TOKEN")
sesong=$(jq -r .sesong <<<"$svar")
if [[ $(jq -r .arkivert <<<"$svar") == null ]]; then
  echo "Ingenting å arkivere for sesong $sesong." >&2
  exit 1
fi
mappe="$MEDIA/_arkiv/$(date +%F)"
mkdir -p "$mappe"
jq .arkiv <<<"$svar" >"$mappe/state-$sesong.json"
jq .minner <<<"$svar" >"$mappe/minner-$sesong.json"
echo "Arkivert $(jq -r .arkivert <<<"$svar") ($(jq -r .nøkler <<<"$svar") nøkler): $mappe/state-$sesong.json, minner-$sesong.json"
