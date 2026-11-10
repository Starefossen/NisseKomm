# Sourced by the other scripts. fnox only finds the key from the project folder.
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
K=$(cd "$ROOT" && fnox get GEMINI_API_KEY)
