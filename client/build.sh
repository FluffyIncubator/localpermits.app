#!/usr/bin/env bash

set -Eeu
set -o pipefail

###

function copy {
	cp -r ./src/static/* ./build/
	printf "Copied..."
}

function embed {
	content=""
	sep=$'\n\n'

	for file in $(find ./src -name "*.tsx"); do
		content="$content$sep$(cat $file)"
	done

	template=$(cat ./src/index.html | CONTENT="$content" envsubst)
	printf "Embedded..."

	echo "$template" > ./build/index.html
}

function update {
	printf "\r                                            \r[%s] \e[1;33m" "$(date)"
	copy
	embed
	printf "Done\e[0m"
}

function watch_for_changes {	
	old_md5=""
	while :
	do
		md5=$(ls -lr --time-style=full-iso ./src/* | md5sum)
		if [ "$md5" != "$old_md5" ]; then
			update
			old_md5="$md5"
		fi
		sleep 1	
	done
}

function main {
	mkdir -p ./build

	echo "Start janky file watcher..."
	watch_for_changes
}

main