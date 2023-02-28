#!/usr/bin/env bash

set -Eeu
set -o pipefail

###

reIMPORT="import.*['\"](\./.*)['\"].*"
declare -a DEPENDENCIES

function copy {
	cp -r ./src/static/* ./build/
	printf "Copied..."
}

function get_abs_path {
	echo "$(cd "$(dirname $1)"; pwd)/$(basename "$1")"
}

function build_dependencies {
	local absolute_target="$(get_abs_path "$1")"

	local line=""
	while IFS= read -r line; do
		if [[ $line =~ $reIMPORT ]]; then
			absolute_dep=$(get_abs_path $(dirname $absolute_target)/${BASH_REMATCH[1]}.tsx)
			DEPENDENCIES+=("$absolute_target $absolute_dep")
			build_dependencies $absolute_dep
		fi
	done <<< "$(cat $absolute_target)"z
}

function getpairs {
	for pair in "${DEPENDENCIES[@]}"; do
		echo "$pair"
	done
}

function embed {
	local TSX=""
	local SEP=$'\n\n'

	local file=""
	local pairs="$(getpairs)"
	

	for file in $(echo "$pairs" | tsort | tac); do
		TSX="$TSX$SEP$(cat $file)"
	done

	template=$(cat ./src/index.html | CONTENT="$TSX" envsubst)
	printf "Embedded..."

	echo "$template" > ./build/index.html
}

function update {
	printf "\r                                            \r[%s] \e[1;33m" "$(date)"

	printf "Copy..."
	copy

	DEPENDENCIES=()
	printf "Build dependencies..."
	build_dependencies $1

	printf "Embed..."
	embed

	printf "Done\e[0m"
}

function watch_for_changes {	
	old_md5=""
	while :
	do
		md5=$(ls -lR --time-style=full-iso $2 | md5sum)
		if [ "$md5" != "$old_md5" ]; then
			update $1
		fi
		old_md5="$md5"
		sleep 1	
	done
}

function main {
	mkdir -p ./build

	echo "Start janky file watcher..."
	watch_for_changes $1 $2
}

main $1 $2