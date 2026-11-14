#!/usr/bin/env bash
# Mirror NisseKomm's untracked state (media, takes, verdicts) to iCloud Drive.
# Reads the source only; --delete acts inside the mirror folder.
# Usage: scripts/backup.sh [--dry-run]
set -euo pipefail

KILDE="${NISSEKOMM_KILDE:-$HOME/go/src/github.com/starefossen/NisseKomm}"
MAL="${NISSEKOMM_BACKUP:-$HOME/Library/Mobile Documents/com~apple~CloudDocs/NisseKomm-backup}"
BEHOLD_DAGER=14
DRY=""
[[ "${1:-}" == "--dry-run" ]] && DRY="--dry-run"

mkdir -p "$MAL/speil" "$MAL/daglig"
LOG="$MAL/backup.log"
log() { printf '%s %s\n' "$(date '+%F %T')" "$*" | tee -a "$LOG"; }

[[ -d "$KILDE/public" ]] || { log "FEIL: finner ikke $KILDE/public"; exit 1; }

# Free space: what is in the source plus 1 GiB headroom (overestimates after the first run).
trenger_kb=$(( $(du -sk "$KILDE/public" "$KILDE/assets/out" 2>/dev/null | awk '{s+=$1} END{print s}') + 1048576 ))
ledig_kb=$(df -k "$MAL" | awk 'NR==2{print $4}')
if (( ledig_kb < trenger_kb )); then
  log "STOPP: for lite plass i $MAL: ledig $((ledig_kb/1024)) MiB, trenger $((trenger_kb/1024)) MiB"
  exit 2
fi

start=$(date +%s)
log "start ${DRY:-ekte} fra $KILDE"
rsync -a --delete $DRY "$KILDE/public/" "$MAL/speil/public/"
[[ -d "$KILDE/assets/out" ]] && rsync -a --delete $DRY "$KILDE/assets/out/" "$MAL/speil/assets-out/"
for f in docs/beslutninger-apne.json .data/dev-store.json; do
  [[ -f "$KILDE/$f" ]] && rsync -a $DRY "$KILDE/$f" "$MAL/speil/$(basename "$f")"
done

# Daily copy of the small JSON files.
dag="$MAL/daglig/$(date +%F)"
if [[ -z "$DRY" ]]; then
  mkdir -p "$dag"
  for f in public/media-vurdering.json docs/beslutninger-apne.json .data/dev-store.json assets/out/forbruk.jsonl; do
    [[ -f "$KILDE/$f" ]] && cp -p "$KILDE/$f" "$dag/"
  done
  ls -1d "$MAL/daglig"/????-??-?? 2>/dev/null | sort -r | tail -n +$((BEHOLD_DAGER + 1)) | while read -r gammel; do
    rm -rf "$gammel"; log "slettet $gammel"
  done
fi
log "ferdig på $(( $(date +%s) - start )) s, speil $(du -sh "$MAL/speil" | cut -f1)"
