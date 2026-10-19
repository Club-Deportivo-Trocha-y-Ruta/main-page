#!/usr/bin/env bash
#
# Sube la carpeta de medios (por defecto ~/Trocha-media/) a /public_html/media/
# en Hostinger por FTPS, con lftp. Es la tarea T1 de docs/10-plan-media-hostinger.md.
#
# Uso:
#   npm run media:push -- --dry-run --only valida-yumbo-2026     # ensayo
#   npm run media:push -- --only valida-yumbo-2026               # subida de verdad
#   bash scripts/media-push.sh [--dry-run] [--only <subcarpeta>] [--exclude <glob>]...
#
# Opciones:
#   --dry-run          Muestra lo que subiría sin subir ni crear nada.
#   --only <subcarpeta>  Sube solo esa subcarpeta de MEDIA_SRC (p. ej. valida-yumbo-2026,
#                      o valida-yumbo-2026/thumb). SIEMPRE conviene usarla: sin ella se
#                      sube todo lo que haya en MEDIA_SRC.
#   --exclude <glob>   Patrón extra a excluir (se puede repetir), relativo a lo que se sube.
#                      Con una conexión lenta, primero las miniaturas y las versiones web:
#                        --only valida-yumbo-2026 --exclude 'original/'
#                      y después los originales:
#                        --only valida-yumbo-2026/original
#   -h, --help         Esta ayuda.
#
# Variables (de .env en la raíz del repo o del entorno; nunca se imprimen):
#   FTP_SERVER, FTP_USERNAME, FTP_PASSWORD   las mismas credenciales FTPS del deploy
#   MEDIA_SRC          carpeta local a subir (por defecto ~/Trocha-media)
#   FTP_VERIFY_CERT    yes (por defecto) o no, si el servidor presenta un certificado
#                      que lftp no reconoce (el deploy de CI usa no)
#
# Garantías:
# - Nunca borra nada en el servidor (no hay --delete): lo que se retire se borra a
#   mano desde hPanel.
# - Sube cada archivo con un nombre temporal (.in.<nombre>) y lo renombra al
#   terminar: un corte a mitad de una foto no deja un archivo cortado con su nombre
#   final, que --only-newer daría por bueno para siempre.
# - Nunca sube: carpetas que terminen en -familiar (fotos solo para las familias),
#   las que empiecen por _ (borradores y respaldos), .DS_Store ni *.bak.json.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="${ENV_FILE:-$REPO_ROOT/.env}"
REMOTE_ROOT="/public_html/media"

die() {
  echo "Error: $*" >&2
  exit 1
}

usage() {
  # La cabecera de este archivo es la ayuda: se imprime hasta la primera línea que no es comentario.
  sed -n '3,/^set -/p' "${BASH_SOURCE[0]}" | sed -e '/^set -/d' -e 's/^# \{0,1\}//'
}

# ── Argumentos ──────────────────────────────────────────────────────────────────

DRY_RUN=0
ONLY=""
EXCLUDES=()
while [ $# -gt 0 ]; do
  case "$1" in
    --dry-run) DRY_RUN=1 ;;
    --only)
      # Un valor vacío (p. ej. una variable sin definir) NO puede caer en «subirlo todo».
      { [ $# -ge 2 ] && [ -n "$2" ]; } || die "--only necesita una subcarpeta (p. ej. --only valida-yumbo-2026)"
      ONLY="$2"
      shift
      ;;
    --only=*)
      ONLY="${1#--only=}"
      [ -n "$ONLY" ] || die "--only necesita una subcarpeta (p. ej. --only=valida-yumbo-2026)"
      ;;
    --exclude)
      { [ $# -ge 2 ] && [ -n "$2" ]; } || die "--exclude necesita un patrón (p. ej. --exclude 'original/')"
      EXCLUDES+=("$2")
      shift
      ;;
    --exclude=*)
      [ -n "${1#--exclude=}" ] || die "--exclude necesita un patrón (p. ej. --exclude='original/')"
      EXCLUDES+=("${1#--exclude=}")
      ;;
    -h | --help)
      usage
      exit 0
      ;;
    *) die "Opción desconocida: $1 (usa --help)" ;;
  esac
  shift
done

# `npm run media:push --dry-run` (sin el `--` que separa los argumentos) se lo come npm y el
# script no se entera: sin esta guarda haría una subida de verdad. npm lo deja en el entorno.
if [ "${npm_config_dry_run:-}" = "true" ] && [ "$DRY_RUN" -eq 0 ]; then
  DRY_RUN=1
  echo "Aviso: npm recibió --dry-run antes del «--»; lo trato como ensayo." >&2
  echo "       La forma correcta es: npm run media:push -- --dry-run" >&2
fi

# ── lftp ────────────────────────────────────────────────────────────────────────

if ! command -v lftp >/dev/null 2>&1; then
  cat >&2 <<'MENSAJE'
Instala lftp: brew install lftp

Si no puedes instalarlo, sube la carpeta a mano por el gestor de archivos de hPanel:

  1. Comprime cada subcarpeta en zips de menos de 1 GB (el gestor de hPanel limita lo
     que se sube de una vez: 1 GB en Single, 1,5 GB en Premium, 2 GB en Unlimited).
     Los JPG ya vienen comprimidos: -0 guarda sin recomprimir y es mucho más rápido.

       cd ~/Trocha-media/valida-yumbo-2026
       zip -0 -r thumb.zip thumb
       zip -0 -r web.zip web
       zip -0 base.zip .htaccess original/.htaccess manifest.json
       find original -name '*.jpg' | sort | split -l 60 - /tmp/lote-original-
       for lote in /tmp/lote-original-*; do zip -0 "original-$(basename "$lote").zip" -@ < "$lote"; done

     (60 originales por zip: unos 900 MB si pesan 15 MB cada uno. Ajusta -l si pesan menos.)

  2. En hPanel: Archivos > Administrador de archivos > public_html/media/valida-yumbo-2026
     (créala si no existe) > Subir > cada .zip > clic derecho > Extraer en esa misma carpeta.
     Los zips ya traen las subcarpetas thumb/, web/ y original/. Borra los .zip al terminar.

  3. NO subas la carpeta valida-yumbo-2026-familiar: es solo para las familias.
MENSAJE
  exit 127
fi

# ── Credenciales ────────────────────────────────────────────────────────────────

# Lee NOMBRE=valor de un archivo .env SIN ejecutarlo (nada de `source`): quita las
# comillas envolventes y el retorno de carro de los .env creados en Windows.
read_env_var() {
  local name="$1" line value
  [ -f "$ENV_FILE" ] || return 0
  line="$(grep -E "^[[:space:]]*(export[[:space:]]+)?${name}=" "$ENV_FILE" | tail -n 1 || true)"
  [ -n "$line" ] || return 0
  value="${line#*=}"
  value="${value%$'\r'}"
  case "$value" in
    \"*\")
      value="${value#\"}"
      value="${value%\"}"
      ;;
    \'*\')
      value="${value#\'}"
      value="${value%\'}"
      ;;
  esac
  printf '%s' "$value"
}

# Lo que ya esté en el entorno manda sobre .env.
FTP_SERVER="${FTP_SERVER:-$(read_env_var FTP_SERVER)}"
FTP_USERNAME="${FTP_USERNAME:-$(read_env_var FTP_USERNAME)}"
FTP_PASSWORD="${FTP_PASSWORD:-$(read_env_var FTP_PASSWORD)}"

missing=""
[ -n "$FTP_SERVER" ] || missing="$missing FTP_SERVER"
[ -n "$FTP_USERNAME" ] || missing="$missing FTP_USERNAME"
[ -n "$FTP_PASSWORD" ] || missing="$missing FTP_PASSWORD"
if [ -n "$missing" ]; then
  echo "Error: faltan credenciales FTP:${missing}" >&2
  echo "Ponlas en $ENV_FILE (hay un modelo en .env.example) o expórtalas en el entorno." >&2
  exit 1
fi

VERIFY_CERT="${FTP_VERIFY_CERT:-yes}"
case "$VERIFY_CERT" in
  yes | no) ;;
  *) die "FTP_VERIFY_CERT debe ser yes o no (llegó: $VERIFY_CERT)" ;;
esac

# ── Qué se sube y adónde ───────────────────────────────────────────────────────

MEDIA_SRC="${MEDIA_SRC:-$HOME/Trocha-media}"
MEDIA_SRC="${MEDIA_SRC%/}"
[ -d "$MEDIA_SRC" ] || die "No existe la carpeta de medios: $MEDIA_SRC (¿corriste scripts/valida-fotos.mjs?)"

LOCAL="$MEDIA_SRC"
REMOTE="$REMOTE_ROOT"
if [ -n "$ONLY" ]; then
  ONLY="${ONLY%/}"
  case "$ONLY" in
    '' | /* | *..*) die "--only tiene que ser una subcarpeta de $MEDIA_SRC, sin / al inicio ni .. (llegó: $ONLY)" ;;
  esac
  LOCAL="$MEDIA_SRC/$ONLY"
  REMOTE="$REMOTE_ROOT/$ONLY"
  [ -d "$LOCAL" ] || die "No existe la subcarpeta: $LOCAL"
fi

# Lo que nunca debe llegar al hosting, aunque se les pase la carpeta equivocada.
EXCLUDE_ARGS=(
  '*-familiar/'
  '_*/'
  '.DS_Store'
  '*/.DS_Store'
  '*.bak.json'
  '.*.tmp.*'
)
# `${EXCLUDES[@]+...}`: con arreglos vacíos, bash 3.2 (el de macOS) falla bajo `set -u`.
for pattern in ${EXCLUDES[@]+"${EXCLUDES[@]}"}; do
  EXCLUDE_ARGS+=("$pattern")
done

# Escapa lo que lftp trata como especial dentro de comillas dobles.
lftp_quote() {
  printf '%s' "$1" | sed -e 's/\\/\\\\/g' -e 's/"/\\"/g'
}

MIRROR="mirror --reverse --only-newer --parallel=4 --verbose"
[ "$DRY_RUN" -eq 1 ] && MIRROR="$MIRROR --dry-run"
for pattern in "${EXCLUDE_ARGS[@]}"; do
  MIRROR="$MIRROR --exclude-glob \"$(lftp_quote "$pattern")\""
done
MIRROR="$MIRROR \"$(lftp_quote "$LOCAL")\" \"$(lftp_quote "$REMOTE")\""

# En un ensayo no se toca el servidor: ni siquiera se crea la carpeta de destino.
MKDIR="mkdir -p -f \"$(lftp_quote "$REMOTE")\""
[ "$DRY_RUN" -eq 1 ] && MKDIR="# (ensayo: no se crea la carpeta remota)"

size="$(du -sh "$LOCAL" 2>/dev/null | cut -f1 | tr -d "[:space:]" || true)"
echo "Origen:  $LOCAL${size:+ ($size)}"
echo "Destino: $REMOTE  (FTPS, certificado verificado: $VERIFY_CERT)"
if [ "$DRY_RUN" -eq 1 ]; then
  echo "Modo:    ENSAYO (--dry-run): no se sube nada."
else
  echo "Modo:    subida de verdad. Nunca se borra nada en el servidor."
fi
[ -n "$ONLY" ] || echo "Aviso:   sin --only se sube TODO lo que haya en $MEDIA_SRC (menos lo excluido)."
echo

# La contraseña viaja por la variable LFTP_PASSWORD y el script por la entrada
# estándar: así no aparece en la lista de procesos ni en el historial.
status=0
LFTP_PASSWORD="$FTP_PASSWORD" lftp -f /dev/stdin <<LFTP_SCRIPT || status=$?
set cmd:fail-exit yes
set ftp:ssl-force true
set ftp:ssl-protect-data true
set ssl:verify-certificate $VERIFY_CERT
set net:max-retries 10
set net:persist-retries 5
set net:reconnect-interval-base 5
set net:reconnect-interval-multiplier 1.5
set net:reconnect-interval-max 60
set net:timeout 30
set mirror:parallel-transfer-count 4
set mirror:set-permissions off
set xfer:clobber on
set xfer:use-temp-file yes
set xfer:temp-file-name ".in.*"
open --env-password -u "$(lftp_quote "$FTP_USERNAME")" "$(lftp_quote "$FTP_SERVER")"
$MKDIR
$MIRROR
bye
LFTP_SCRIPT

if [ "$status" -ne 0 ]; then
  echo >&2
  echo "lftp terminó con error (código $status). Es seguro volver a correr el mismo comando: retoma lo que falte." >&2
  echo "Si el error menciona «Certificate» o «verification», prueba con FTP_VERIFY_CERT=no (el deploy de CI lo usa)." >&2
  exit "$status"
fi

echo
if [ "$DRY_RUN" -eq 1 ]; then
  echo "Ensayo terminado. Si la lista es la esperada, repite el comando sin --dry-run."
else
  echo "Subida terminada. Verifica en el navegador una URL de cada carpeta (thumb, web y original)."
fi
