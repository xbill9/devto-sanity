# source ./env.sh — switch to the project's Node (.nvmrc: 24 LTS; Debian trixie ships 20, and
# Sanity Studio 6 needs >= 22.12), load .env, and derive each app's prefixed variables from the
# shared ones so they can't drift apart.
export NVM_DIR="${NVM_DIR:-$HOME/.config/nvm}"
if [ -s "$NVM_DIR/nvm.sh" ]; then
  . "$NVM_DIR/nvm.sh" --no-use
  nvm use --silent "$(cat "$(dirname "${BASH_SOURCE[0]}")/.nvmrc")" || echo "env.sh: run 'nvm install' first" >&2
else
  echo "env.sh: nvm not found at $NVM_DIR — install nvm, then 'nvm install'" >&2
fi
_brawndo_env="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/.env"
if [ -f "$_brawndo_env" ]; then set -a; . "$_brawndo_env"; set +a; fi
unset _brawndo_env
if [ -n "${SANITY_PROJECT_ID:-}" ]; then
  export SANITY_STUDIO_PROJECT_ID="$SANITY_PROJECT_ID" NEXT_PUBLIC_SANITY_PROJECT_ID="$SANITY_PROJECT_ID" SANITY_APP_PROJECT_ID="$SANITY_PROJECT_ID"
fi
export SANITY_DATASET="${SANITY_DATASET:-production}" WORKFLOW_TAG="${WORKFLOW_TAG:-dev}"
export SANITY_STUDIO_DATASET="$SANITY_DATASET" NEXT_PUBLIC_SANITY_DATASET="$SANITY_DATASET" SANITY_APP_DATASET="$SANITY_DATASET"
export SANITY_STUDIO_WORKFLOW_TAG="$WORKFLOW_TAG" SANITY_APP_WORKFLOW_TAG="$WORKFLOW_TAG"
if [ -n "${SANITY_ORGANIZATION_ID:-}" ]; then export SANITY_APP_ORGANIZATION_ID="$SANITY_ORGANIZATION_ID"; fi
