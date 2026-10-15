#!/usr/bin/env bash
# Save or load the MariaDB image used by wp-env (compose service "mysql").
# WordPress/CLI images are built per job; only mariadb:* is pulled from a registry.
set -euo pipefail

mode="${1:?usage: wp-env-docker-image-cache.sh save|load [archive-path]}"
archive="${2:-wp-env-mariadb-image.tar}"

list_mariadb_images() {
	local refs=() ids=()

	# wp-env names the database service "mysql" (image mariadb:<tag>).
	mapfile -t ids < <(docker ps -aq --filter 'label=com.docker.compose.service=mysql' 2>/dev/null || true)
	if ((${#ids[@]} > 0)); then
		mapfile -t refs < <(docker inspect "${ids[@]}" --format '{{.Config.Image}}' | sort -u)
	fi

	if ((${#refs[@]} == 0)); then
		mapfile -t refs < <(
			docker images --format '{{.Repository}}:{{.Tag}}' |
				grep -E '^mariadb:' |
				grep -v ':<none>$' |
				sort -u
		)
	fi

	printf '%s\n' "${refs[@]}"
}

case "$mode" in
	load)
		if [[ ! -f "$archive" ]]; then
			echo "No MariaDB image archive at ${archive}; skipping load."
			exit 0
		fi
		docker load -i "$archive"
		;;
	save)
		mapfile -t images < <(list_mariadb_images)
		if ((${#images[@]} == 0)); then
			echo "No MariaDB image to save."
			exit 0
		fi
		echo "Saving MariaDB image(s) to ${archive}: ${images[*]}"
		docker save "${images[@]}" -o "$archive"
		;;
	*)
		echo "Unknown mode: ${mode}" >&2
		exit 1
		;;
esac
