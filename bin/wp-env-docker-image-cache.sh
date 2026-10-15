#!/usr/bin/env bash
# Save or load Docker images for a wp-env stack (mariadb + compose-built services).
# Used by polylang/actions/e2e; avoids caching every image on the runner (see #21).
set -euo pipefail

mode="${1:?usage: wp-env-docker-image-cache.sh save|load [archive-path]}"
archive="${2:-wp-env-docker-images.tar}"

list_wp_env_images() {
	# Images referenced by compose-managed containers (wp-env labels every service).
	mapfile -t ids < <(
		docker ps -aq --filter 'label=com.docker.compose.project' 2>/dev/null || true
	)
	if ((${#ids[@]} == 0)); then
		return 0
	fi
	docker inspect "${ids[@]}" --format '{{.Image}}' | sort -u
}

case "$mode" in
	load)
		if [[ ! -f "$archive" ]]; then
			echo "No Docker image archive at ${archive}; skipping load."
			exit 0
		fi
		docker load -i "$archive"
		;;
	save)
		mapfile -t images < <(list_wp_env_images)
		if ((${#images[@]} == 0)); then
			echo "No wp-env Docker images to save."
			exit 0
		fi
		echo "Saving ${#images[@]} Docker image(s) to ${archive}."
		docker save "${images[@]}" -o "$archive"
		;;
	*)
		echo "Unknown mode: ${mode}" >&2
		exit 1
		;;
esac
