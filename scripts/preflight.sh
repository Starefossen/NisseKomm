#!/usr/bin/env bash
# Checklist before a deploy (Varden runs it): scripts/preflight.sh
# Exits 1 on the first hard failure; prints the manual steps (media sync, pg_dump) at the end.
set -uo pipefail
cd "$(dirname "$0")/.." || exit 1
fail() { echo "PREFLIGHT FEIL: $*" >&2; exit 1; }
ok() { echo "ok  $*"; }

[ -z "$(git status --porcelain)" ] || fail "uncommitted eller usporede filer"
ok "rent tre"
[ "$(git symbolic-ref -q --short HEAD)" = main ] || fail "ikke på main"
git fetch -q origin main || fail "git fetch"
SHA=$(git rev-parse HEAD)
[ "$SHA" = "$(git rev-parse origin/main)" ] || fail "main ≠ origin/main"
ok "main = origin/main ($(git rev-parse --short=12 HEAD))"
CI=$(gh run list --workflow CI --commit "$SHA" --json conclusion,status,url -q '.[0] | "\(.status) \(.conclusion) \(.url)"' 2>/dev/null)
[[ $CI == "completed success "* ]] || fail "CI ikke grønn på $SHA: ${CI:-ingen kjøring}"
ok "CI grønn: ${CI##* }"
if env | grep -qE '^NEXT_PUBLIC_(MOCK_|TEST_MODE)'; then fail "NEXT_PUBLIC_MOCK_*/TEST_MODE satt i miljøet"; fi
ok "ingen NEXT_PUBLIC_MOCK_*/TEST_MODE"
node scripts/sjekk-klientkoder.mjs --build >/dev/null || fail "sjekk-koder: kode i klient-JS eller HTML"
ok "sjekk-koder"

cat <<T

Klar for image: mise run image:push  ->  registry.intern.flaatten.org:5000/nissekomm:$(git rev-parse --short=12 HEAD)
Før utrulling (Varden, manuelt):
  1. Mediesynk: er MEDIA_DIR i klyngen oppdatert med nye/«tatt i bruk»-filer? (videoer, strek/, audio/)
  2. pg_dump av prod før ny versjon, f.eks.:
       pg_dump "\$DATABASE_URL" -Fc -f nissekomm-\$(date +%Y%m%d-%H%M)-før-$(git rev-parse --short=12 HEAD).dump
  3. Ruller ut taggen over (ikke :latest), og sjekk etterpå at /api/health svarer sha=$(git rev-parse --short=12 HEAD)
T
