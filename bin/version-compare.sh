#!/bin/bash

version_compare () {
    if [[ $1 == 'latest' ]] || [[ $1 == 'dev' ]] || [[ $1 == 'nightly' ]]
    then
		# Set first arg to a huge number considering latest, dev or nightly to be the highest version.
        set -- 1000000 "${@:2}"
    fi
    if [[ $2 == 'latest' ]] || [[ $2 == 'dev' ]] || [[ $2 == 'nightly' ]]
    then
		# Set second arg to a huge number considering latest, dev or nightly to be the highest version.
        set -- "${@:1:1}" 1000000
    fi
    if [[ $1 == $2 ]]
    then
        return 0
    fi
    local IFS=.
    local i ver1=($1) ver2=($2)
    # Fill empty fields in ver1 with zeros.
    for ((i=${#ver1[@]}; i<${#ver2[@]}; i++))
    do
        ver1[i]=0
    done
    for ((i=0; i<${#ver1[@]}; i++))
    do
        if [[ -z ${ver2[i]} ]]
        then
            # Fill empty fields in ver2 with zeros.
            ver2[i]=0
        fi
        if ((10#${ver1[i]} > 10#${ver2[i]}))
        then
            return 1
        fi
        if ((10#${ver1[i]} < 10#${ver2[i]}))
        then
            return 2
        fi
    done
    return 0
}

version_compare $1 $2
case $? in
	0) op='=';;
	1) op='>';;
	2) op='<';;
esac
if [[ $op != $3 ]]
then
	# echo "result=$(echo false)" >> $GITHUB_OUTPUT
	echo false
else
	# echo "result=$(echo true)" >> $GITHUB_OUTPUT
	echo true
fi
