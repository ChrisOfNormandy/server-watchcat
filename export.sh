#!/bin/bash

PKG_VERSION=`node -p "require('./package.json').version"`
RELEASE_NAME=watchcat_$PKG_VERSION
RELEASE_PATH="releases/$RELEASE_NAME"

if [ ! -d releases ]
then
    mkdir releases
fi

if [ ! -d $RELEASE_PATH ]
then
    mkdir $RELEASE_PATH
fi

yarn build && cp -r watchcat/build $RELEASE_PATH/build

cp -r src $RELEASE_PATH
cp -r documentation $RELEASE_PATH
cp index.js $RELEASE_PATH
cp package.json $RELEASE_PATH
cp .env $RELEASE_PATH
cp env.js $RELEASE_PATH
cp README.md $RELEASE_PATH

cp -r bot $RELEASE_PATH
rm -r $RELEASE_PATH/bot/node_modules
rm $RELEASE_PATH/bot/config/config.json

cd releases && zip -r "$RELEASE_NAME.zip" $RELEASE_NAME