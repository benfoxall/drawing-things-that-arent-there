#!/bin/bash

mkdir -p talk/lib

cp -r node_modules/reveal.js talk/lib/reveal.js
cp -r node_modules/slide-builder/slide-builder.js talk/lib/slide-builder.js
cp -r node_modules/localforage/dist/localforage.js talk/lib/localforage.js
cp -r node_modules/gl-matrix/dist/gl-matrix.js talk/lib/gl-matrix.js
cp -r node_modules/quaternion/quaternion.js talk/lib/quaternion.js
