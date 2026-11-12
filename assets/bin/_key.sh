# Sourced by the other scripts. fnox only finds the key from the project folder.
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
K="${GEMINI_API_KEY:-$(cd "$ROOT" && fnox get GEMINI_API_KEY)}"
# bruk <type> <modell> <element>: budget guard plus usage line before a paid call (type: video|bilde|tts|transkripsjon).
# Exit 78 stops the caller with the message from forbruk.py; OVER_BUDSJETT=1 lifts the guard.
bruk() {
  python3 "$ROOT/assets/bin/forbruk.py" sjekk "$1" || exit $?
  python3 "$ROOT/assets/bin/forbruk.py" logg "$1" "$2" "$(basename "$0")" "$3"
}
