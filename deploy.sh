#!/bin/bash

rm -rf docs/* \
    && cp -r app docs/ \
    && cp -r bower_components docs/ \
    && cp -r components docs/ \
    && cp -r js docs/ \
    && cp -r index.html docs/ \
    || { echo "Copy failed"; exit; }
