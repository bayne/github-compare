#!/bin/bash

git log deploy.sh \
    || { echo "Wrong directory"; exit; }

cd prod && git fetch origin && git reset --hard origin/gh-pages \
    || { echo "Unable to clean up"; exit; }

rm -rf prod/* \
    && cd ../ \
    && cp -r app prod/ \
    && cp -r bower_components prod/ \
    && cp -r components prod/ \
    && cp -r js prod/ \
    && cp -r index.html prod/ \
    || { echo "Copy failed"; exit; }

cd prod
git ls-files --deleted -z | xargs -0 git rm
git add . && git add -u && git commit -m "Deploy" && git push origin gh-pages \
    || { echo "Push failed"; exit; }
