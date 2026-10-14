#!/usr/bin/env bash
# Client minimal de l'API Abby (https://api.abby.fr) pour les devis.
# Endpoints relevés dans le SDK officiel @abby-inc/node 2.5.0 (doc : https://docs.abby.fr).
# Clé : variable d'environnement ABBY_API_KEY (jamais en clair dans ce dépôt).
#
# Usage :
#   abby.sh check                       teste la clé
#   abby.sh clients "<recherche>"       cherche organisations + contacts
#   abby.sh org-contacts <orgId>        contacts d'une organisation
#   abby.sh create-org <json>           crée une organisation (CreateOrganizationDto)
#   abby.sh create-contact <json>       crée un contact (CreateContactDto)
#   abby.sh create <spec.json>          crée le devis (voir references/api.md)
#   abby.sh get <devisId>               lit un devis
#   abby.sh finalize <devisId>          finalise (attribue le numéro D-AAAA-NNNN, irréversible)
#   abby.sh download <devisId> <out.pdf>
#   abby.sh delete <devisId>            supprime un brouillon
set -euo pipefail

BASE="${ABBY_BASE_URL:-https://api.abby.fr}"

die() { echo "ERREUR: $*" >&2; exit 1; }
[ -n "${ABBY_API_KEY:-}" ] || die "ABBY_API_KEY absente de l'environnement."
command -v jq >/dev/null || die "jq requis."

# api METHOD PATH [BODY]  → corps JSON sur stdout, échoue (avec le corps d'erreur) si HTTP >= 400
api() {
  local method=$1 path=$2 body=${3:-} tmp code
  tmp=$(mktemp)
  local args=(-sS -X "$method" -o "$tmp" -w '%{http_code}'
    -H "Authorization: Bearer $ABBY_API_KEY" -H 'Accept: application/json')
  [ -n "$body" ] && args+=(-H 'Content-Type: application/json' --data "$body")
  code=$(curl "${args[@]}" "$BASE$path") || { rm -f "$tmp"; die "réseau ($method $path) — domaine api.abby.fr autorisé ?"; }
  if [ "$code" -ge 400 ]; then
    echo "HTTP $code sur $method $path :" >&2; cat "$tmp" >&2; echo >&2; rm -f "$tmp"; exit 1
  fi
  cat "$tmp"; rm -f "$tmp"
}

urlenc() { jq -rn --arg s "$1" '$s|@uri'; }

summary() {
  jq '{id, number, state, finalizable, customer: (.customer.name // .customer),
       emittedAt, expiredAt,
       totalHT: (.total.amountWithoutTaxAfterDiscount/100),
       totalTTC: (.total.amountWithTaxAfterDiscount/100),
       finalizeRequirements: [.finalizeRequirements[]?.message],
       warnings: [.warnings[]?]}'
}

cmd=${1:-}; shift || true
case "$cmd" in
  check)
    api GET "/organizations?page=1&limit=1" >/dev/null && echo "OK : clé Abby valide." ;;

  clients)
    q=$(urlenc "${1:?recherche requise}")
    echo "## Organisations"
    api GET "/organizations?page=1&limit=10&search=$q" \
      | jq -r '.docs[] | "\(.id)\t\(.name)\t\(.emails // [] | join(","))\tSIRET \(.siret // "-")"'
    echo "## Contacts"
    api GET "/contacts?page=1&limit=10&search=$q" \
      | jq -r '.docs[] | "\(.id)\t\(.firstname) \(.lastname)\t\(.emails // [] | join(","))\torg: \(.organization.name // "-")"' ;;

  org-contacts)
    api GET "/organization/${1:?orgId}/contacts" | jq . ;;

  create-org)
    api POST "/organization" "${1:?json}" | jq '{id, name}' ;;

  create-contact)
    api POST "/contact" "${1:?json}" | jq '{id, firstname, lastname}' ;;

  create)
    spec=$(cat "${1:?spec.json requis}")
    cid=$(jq -r '.customerId // empty' <<<"$spec"); [ -n "$cid" ] || die "customerId manquant dans la spec."
    type=$(jq -r '.estimateType // "estimate"' <<<"$spec")

    est=$(api POST "/v2/billing/estimate/$cid" "$(jq -n --arg t "$type" '{estimateType:$t}')")
    id=$(jq -r .id <<<"$est")
    echo "Brouillon créé : $id" >&2

    # En cas d'échec après la création, on garde le brouillon et on donne son id.
    trap 'echo "Brouillon $id conservé (abby.sh delete $id pour le supprimer)." >&2' ERR

    api PATCH "/v2/billing/$id/lines" "$(jq '{lines} + (if .discount then {discount} else {} end)' <<<"$spec")" >/dev/null

    if jq -e '.generalInformations' <<<"$spec" >/dev/null; then
      api PATCH "/v2/billing/estimate/$id/general-informations" "$(jq '.generalInformations' <<<"$spec")" >/dev/null
    fi

    if jq -e '.title' <<<"$spec" >/dev/null; then
      api PATCH "/v2/billing/$id/title" "$(jq '{title}' <<<"$spec")" >/dev/null || echo "Titre non appliqué (non bloquant)." >&2
    fi

    # Validité : expiredAt = emittedAt + N jours, dans l'unité renvoyée par l'API (ms ou s).
    if jq -e '.validityDays or .paymentDelay' <<<"$spec" >/dev/null; then
      tl=$(jq -n --argjson e "$est" --argjson s "$spec" '
        ($e.emittedAt) as $em
        | (if $em > 100000000000 then 86400000 else 86400 end) as $day
        | {emittedAt: $em,
           paymentDelay: ($s.paymentDelay // $e.paymentDelay),
           expiredAt: (if $s.validityDays then $em + $s.validityDays * $day else $e.expiredAt end)}')
      api PATCH "/v2/billing/estimate/$id/timeline" "$tl" >/dev/null
    fi

    if [ "$(jq -r '.finalize // false' <<<"$spec")" = true ]; then
      api PATCH "/v2/billing/$id/finalize" >/dev/null
    fi
    trap - ERR
    api GET "/v2/billing/$id" | summary ;;

  get)
    api GET "/v2/billing/${1:?id}" | summary ;;

  finalize)
    api PATCH "/v2/billing/${1:?id}/finalize" | summary ;;

  download)
    id=${1:?id}; out=${2:?chemin du PDF}
    code=$(curl -sS -o "$out" -w '%{http_code}' -H "Authorization: Bearer $ABBY_API_KEY" \
      "$BASE/v2/billing/$id/download?locale=${ABBY_LOCALE:-fr}") || die "réseau (download)"
    [ "$code" -lt 400 ] || { cat "$out" >&2; rm -f "$out"; die "HTTP $code au téléchargement."; }
    head -c 5 "$out" | grep -q '%PDF' || die "La réponse n'est pas un PDF (voir $out)."
    echo "PDF : $out ($(du -h "$out" | cut -f1))" ;;

  delete)
    api DELETE "/v2/billing/${1:?id}" >/dev/null && echo "Supprimé : $1" ;;

  *) sed -n '2,18p' "$0"; exit 1 ;;
esac
