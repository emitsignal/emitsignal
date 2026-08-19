#!/usr/bin/env bash
# Hand-runnable curl recipes for POST /topic/:name.
#
#   ./scripts/publish-curl.sh list
#   ./scripts/publish-curl.sh basic
#   ./scripts/publish-curl.sh all
#
# Config via environment:
#   EMITSIGNAL_API_URL  (default http://localhost:5001)
#   EMITSIGNAL_TOPIC    (default publish-playground)
#   EMITSIGNAL_TOKEN    session token or es_ API key (optional; anonymous otherwise)

set -euo pipefail

API_URL="${EMITSIGNAL_API_URL:-http://localhost:5001}"
TOPIC="${EMITSIGNAL_TOPIC:-publish-playground}"
TOKEN="${EMITSIGNAL_TOKEN:-}"
ENDPOINT="${API_URL%/}/topic/${TOPIC}"

BANNER="https://picsum.photos/id/1018/1200/400"
IMAGE="https://picsum.photos/id/1025/600/400"

auth_args=()
if [[ -n "$TOKEN" ]]; then
    auth_args=(-H "Authorization: Bearer ${TOKEN}")
fi

# post <label> <curl args...>
post() {
    local label="$1"
    shift

    printf '\n\033[35m▸ %s\033[0m\n' "$label"
    curl -sS -w '\nHTTP %{http_code}\n' -X POST "${auth_args[@]}" "$@" "$ENDPOINT"
}

json() {
    local label="$1"
    local payload="$2"

    post "$label" -H 'Content-Type: application/json' --data "$payload"
}

basic() {
    json 'basic — title + body' '{"title":"Deploy finished","body":"web@2.4.1 is live."}'
}

title_only() {
    json 'title only' '{"title":"Title only signal"}'
}

body_only() {
    json 'body only' '{"body":"Body only signal, no title."}'
}

priorities() {
    for priority in 1 2 3 4 5; do
        json "priority ${priority}" \
            "{\"title\":\"Priority ${priority}\",\"body\":\"Severity test\",\"priority\":${priority}}"
    done
}

tags() {
    json 'tags' '{"title":"Tagged signal","body":"Routing metadata","tags":["ci","deploy","production"]}'
}

actions() {
    json 'actions — view + acknowledge' '{
        "title": "Incident opened",
        "body": "Both action kinds (the maximum of 2).",
        "priority": 5,
        "actions": [
            {"type": "view", "label": "View incident", "url": "https://example.com/incident/42"},
            {"type": "acknowledge", "label": "Acknowledge"}
        ]
    }'
}

media() {
    json 'media — banner, inline image, attachment' "{
        \"title\": \"Release 2.0\",
        \"body\": \"Banner plus one inline image and one attachment.\",
        \"bannerImage\": {\"href\": \"${BANNER}\", \"title\": \"Release banner\"},
        \"inlineImages\": [\"${IMAGE}\"],
        \"inlineAttachments\": [\"https://raw.githubusercontent.com/github/gitignore/main/Node.gitignore\"]
    }"
}

scheduled() {
    local when=$(($(date +%s) + 60))

    json 'scheduled — 60s from now (JSON scheduledAt)' \
        "{\"title\":\"Scheduled signal\",\"body\":\"Queued, not delivered now.\",\"scheduledAt\":${when}}"
}

header_basic() {
    post 'header mode — title/x-priority/x-tags' \
        -H 'Content-Type: text/plain' \
        -H 'Title: Header publish' \
        -H 'X-Priority: urgent' \
        -H 'X-Tags: ops,pager' \
        --data 'The raw request body becomes the message body.'
}

header_aliases() {
    post 'header mode — short aliases t/m/p/ta' \
        -H 'Content-Type: text/plain' \
        -H 'T: Short aliases' \
        -H 'M: Body from the m header' \
        -H 'P: 2' \
        -H 'Ta: cli,shorthand' \
        --data 'ignored because the m header wins'
}

header_delay() {
    post 'header mode — x-delay 5m (relative)' \
        -H 'Content-Type: text/plain' \
        -H 'Title: Relative delay' \
        -H 'X-Delay: 5m' \
        --data 'Delivered five minutes from now.'
}

header_media() {
    post 'header mode — x-banner + x-inline-images' \
        -H 'Content-Type: text/plain' \
        -H 'Title: Header media' \
        -H "X-Banner: ${BANNER}" \
        -H "X-Inline-Images: ${IMAGE}" \
        --data 'Media headers accept a URL, a comma-separated list or JSON.'
}

header_actions() {
    post 'header mode — x-actions JSON' \
        -H 'Content-Type: text/plain' \
        -H 'Title: Header actions' \
        -H 'X-Actions: [{"type":"view","label":"Open","url":"https://example.com/header-action"}]' \
        --data 'Actions arrive as a JSON string in x-actions.'
}

errors() {
    json 'error — missing content (400 missing_content)' '{"title":"","body":"   "}'
    json 'error — priority out of range (422)' '{"title":"Priority 6","priority":6}'
    json 'error — view action without url' '{"title":"No url","actions":[{"type":"view"}]}'
    json 'error — non-http media (400 invalid_media)' \
        '{"title":"Bad banner","bannerImage":"ftp://example.com/banner.png"}'

    printf '\n\033[35m▸ error — invalid topic name (400 invalid_topic_name)\033[0m\n'
    curl -sS -w '\nHTTP %{http_code}\n' -X POST "${auth_args[@]}" \
        -H 'Content-Type: application/json' \
        --data '{"title":"Never stored"}' \
        "${API_URL%/}/topic/Not%20a%20valid%20topic!"
}

RECIPES=(
    basic title_only body_only priorities tags actions media scheduled
    header_basic header_aliases header_delay header_media header_actions errors
)

list() {
    printf 'Endpoint: %s\n\nRecipes:\n' "$ENDPOINT"
    printf '  %s\n' "${RECIPES[@]}"
    printf '  all  (runs every recipe above)\n'
}

all() {
    for recipe in "${RECIPES[@]}"; do
        "$recipe"
        # Anonymous publishing is limited to 10/min, authenticated to 60/min.
        sleep "${EMITSIGNAL_SLEEP:-1}"
    done
}

case "${1:-list}" in
    all) all ;;
    list | -h | --help) list ;;
    *)
        if [[ " ${RECIPES[*]} " == *" ${1} "* ]]; then
            "$1"
        else
            printf 'unknown recipe: %s\n\n' "$1" >&2
            list >&2
            exit 1
        fi
        ;;
esac
