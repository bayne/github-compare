#!/bin/bash
( for i in app/*.js app/**/*.js components/**/*.js ; do cat $i ; echo ';'; done ) > js/github-compare.js
