#!/bin/sh
# EmitSignal CLI installer.
#
#   curl -fsSL https://github.com/emitsignal/emitsignal/releases/latest/download/install.sh | sh
#
# Downloads the standalone binary for the current OS/arch from the latest
# GitHub release, verifies its checksum, and installs `emitsignal` (plus an
# `es` symlink) into a directory on PATH. No runtime is required — the binary
# embeds everything it needs.
#
# Environment overrides:
#   ES_INSTALL_DIR        target directory (default: /usr/local/bin, else ~/.local/bin)
#   ES_VERSION            release tag to install (default: latest)
#   ES_INSTALL_BASE_URL   base URL for the archives + checksums (default: GitHub
#                         releases) — for mirrors, self-hosting, or testing

set -eu

REPO="emitsignal/emitsignal"
BINARY="emitsignal"
SYMLINK="es"

info() { printf '\033[0;36m==>\033[0m %s\n' "$1"; }
error() {
    printf '\033[0;31merror:\033[0m %s\n' "$1" >&2
    exit 1
}

# ── Detect platform ────────────────────────────────────────────────────────
detect_platform() {
    os=$(uname -s)
    arch=$(uname -m)

    case "$os" in
        Darwin) os="darwin" ;;
        Linux) os="linux" ;;
        *) error "unsupported operating system: $os (only macOS and Linux are supported)" ;;
    esac

    case "$arch" in
        arm64 | aarch64) arch="arm64" ;;
        x86_64 | amd64) arch="x64" ;;
        *) error "unsupported architecture: $arch (only arm64 and x64 are supported)" ;;
    esac

    printf '%s-%s' "$os" "$arch"
}

# ── Pick a writable install directory ────────────────────────────────────────
resolve_install_dir() {
    if [ -n "${ES_INSTALL_DIR:-}" ]; then
        printf '%s' "$ES_INSTALL_DIR"
        return
    fi

    if [ -w /usr/local/bin ] 2>/dev/null; then
        printf '/usr/local/bin'
    else
        printf '%s/.local/bin' "$HOME"
    fi
}

require_command() {
    command -v "$1" >/dev/null 2>&1 || error "required command not found: $1"
}

verify_checksum() {
    archive="$1"
    checksums="$2"
    expected=$(grep " $(basename "$archive")\$" "$checksums" | awk '{print $1}')

    [ -n "$expected" ] || error "no checksum found for $(basename "$archive")"

    if command -v sha256sum >/dev/null 2>&1; then
        actual=$(sha256sum "$archive" | awk '{print $1}')
    elif command -v shasum >/dev/null 2>&1; then
        actual=$(shasum -a 256 "$archive" | awk '{print $1}')
    else
        error "no sha256 tool found (need sha256sum or shasum)"
    fi

    [ "$expected" = "$actual" ] || error "checksum mismatch for $(basename "$archive")"
}

main() {
    require_command curl
    require_command tar

    platform=$(detect_platform)
    version="${ES_VERSION:-latest}"
    install_dir=$(resolve_install_dir)

    if [ -n "${ES_INSTALL_BASE_URL:-}" ]; then
        base_url="$ES_INSTALL_BASE_URL"
    elif [ "$version" = "latest" ]; then
        base_url="https://github.com/$REPO/releases/latest/download"
    else
        base_url="https://github.com/$REPO/releases/download/$version"
    fi

    archive_name="${BINARY}-${platform}.tar.gz"
    tmp_dir=$(mktemp -d)
    trap 'rm -rf "$tmp_dir"' EXIT

    info "downloading ${archive_name} (${version})"
    curl -fsSL "$base_url/$archive_name" -o "$tmp_dir/$archive_name" ||
        error "download failed — is there a release for $platform?"
    curl -fsSL "$base_url/checksums.txt" -o "$tmp_dir/checksums.txt" ||
        error "could not download checksums.txt"

    info "verifying checksum"
    verify_checksum "$tmp_dir/$archive_name" "$tmp_dir/checksums.txt"

    info "extracting"
    tar -xzf "$tmp_dir/$archive_name" -C "$tmp_dir"

    mkdir -p "$install_dir"
    install -m 0755 "$tmp_dir/$BINARY" "$install_dir/$BINARY"
    ln -sf "$install_dir/$BINARY" "$install_dir/$SYMLINK"

    info "installed to $install_dir/$BINARY (symlinked as $SYMLINK)"

    case ":$PATH:" in
        *":$install_dir:"*) ;;
        *) printf '\033[0;33mnote:\033[0m %s is not on your PATH — add it to your shell profile.\n' "$install_dir" ;;
    esac

    "$install_dir/$BINARY" --version
}

main "$@"
