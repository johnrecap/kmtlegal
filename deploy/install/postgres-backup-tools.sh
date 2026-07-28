#!/usr/bin/env bash

postgres_backup_tool_major() {
  local tool_path="$1"
  local version_output=""
  local major=""

  version_output="$("${tool_path}" --version 2>/dev/null)" || return 1
  major="$(printf '%s\n' "${version_output}" | sed -nE 's/.*[[:space:]]([0-9]+)(\.[0-9]+)*.*/\1/p' | head -n 1)"
  [[ "${major}" =~ ^[0-9]+$ ]] || return 1
  printf '%s\n' "${major}"
}

resolve_postgres_backup_pair() {
  local server_major="$1"
  shift

  if [[ ! "${server_major}" =~ ^[0-9]+$ ]] || (( server_major < 9 )); then
    echo "ERROR: PostgreSQL server major must be a valid numeric version." >&2
    return 1
  fi

  local candidate_dirs=("$@")
  if [[ -n "${POSTGRES_BACKUP_BIN_DIR:-}" ]]; then
    if [[ "${POSTGRES_BACKUP_BIN_DIR}" != /* ]]; then
      echo "ERROR: POSTGRES_BACKUP_BIN_DIR must be an absolute directory." >&2
      return 1
    fi
    candidate_dirs=("${POSTGRES_BACKUP_BIN_DIR%/}")
  fi

  local best_major=""
  local best_dump=""
  local best_restore=""
  local candidate_dir=""
  local dump_path=""
  local restore_path=""
  local dump_major=""
  local restore_major=""

  for candidate_dir in "${candidate_dirs[@]}"; do
    [[ -n "${candidate_dir}" ]] || continue
    candidate_dir="${candidate_dir%/}"
    dump_path="${candidate_dir}/pg_dump"
    restore_path="${candidate_dir}/pg_restore"
    [[ -x "${dump_path}" && -x "${restore_path}" ]] || continue

    dump_major="$(postgres_backup_tool_major "${dump_path}" || true)"
    restore_major="$(postgres_backup_tool_major "${restore_path}" || true)"
    [[ -n "${dump_major}" && "${dump_major}" == "${restore_major}" ]] || continue
    (( dump_major >= server_major )) || continue

    if [[ -z "${best_major}" ]] || (( dump_major < best_major )); then
      best_major="${dump_major}"
      best_dump="${dump_path}"
      best_restore="${restore_path}"
    fi
  done

  if [[ -z "${best_major}" ]]; then
    if [[ -n "${POSTGRES_BACKUP_BIN_DIR:-}" ]]; then
      echo "ERROR: POSTGRES_BACKUP_BIN_DIR does not contain a compatible matching pg_dump/pg_restore pair for PostgreSQL ${server_major}." >&2
    else
      echo "ERROR: No compatible PostgreSQL backup tools were found for server major ${server_major}. Install postgresql-client-${server_major} or set POSTGRES_BACKUP_BIN_DIR to a compatible pg_dump/pg_restore directory." >&2
    fi
    return 1
  fi

  POSTGRES_BACKUP_TOOL_MAJOR="${best_major}"
  PG_DUMP_BIN="${best_dump}"
  PG_RESTORE_BIN="${best_restore}"
}

resolve_installed_postgres_backup_pair() {
  local server_major="$1"
  local candidate_dirs=()
  local candidate_dir=""
  local path_dump=""

  if [[ -n "${POSTGRES_BACKUP_BIN_DIR:-}" ]]; then
    resolve_postgres_backup_pair "${server_major}"
    return
  fi

  candidate_dirs+=(
    "/usr/lib/postgresql/${server_major}/bin"
    "/usr/pgsql-${server_major}/bin"
    "/usr/local/pgsql-${server_major}/bin"
    "/usr/local/pgsql/bin"
    "/www/server/pgsql/bin"
    "/www/server/postgresql/bin"
  )

  for candidate_dir in \
    /usr/lib/postgresql/*/bin \
    /usr/pgsql-*/bin \
    /usr/local/pgsql*/bin \
    /www/server/pgsql*/bin \
    /www/server/postgresql*/bin; do
    [[ -d "${candidate_dir}" ]] && candidate_dirs+=("${candidate_dir}")
  done

  path_dump="$(command -v pg_dump 2>/dev/null || true)"
  if [[ -n "${path_dump}" ]]; then
    candidate_dirs+=("$(dirname "${path_dump}")")
  fi

  resolve_postgres_backup_pair "${server_major}" "${candidate_dirs[@]}"
}

if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then
  set -euo pipefail
  if (( $# < 1 )); then
    echo "Usage: $0 <server-major> [candidate-directory ...]" >&2
    exit 2
  fi

  resolve_postgres_backup_pair "$@"
  printf 'POSTGRES_BACKUP_TOOL_MAJOR=%s\n' "${POSTGRES_BACKUP_TOOL_MAJOR}"
  printf 'PG_DUMP_BIN=%s\n' "${PG_DUMP_BIN}"
  printf 'PG_RESTORE_BIN=%s\n' "${PG_RESTORE_BIN}"
fi
