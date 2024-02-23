#!/bin/bash

if [[ $1 == 'latest' ]] || [[ $1 == 'dev' ]] || [[ $1 == 'nightly' ]]
then
	# Set first arg to a huge number considering latest, dev or nightly to be the highest version.
	set -- 1000000 $2 $3
fi

if [[ $2 == 'latest' ]] || [[ $2 == 'dev' ]] || [[ $2 == 'nightly' ]]
then
	# Set second arg to a huge number considering latest, dev or nightly to be the highest version.
	set -- $1 1000000 $3
fi

if dpkg --compare-versions $1 $3 $2
then
	echo "result=true" >> $GITHUB_OUTPUT
else
	echo "result=false" >> $GITHUB_OUTPUT
fi
