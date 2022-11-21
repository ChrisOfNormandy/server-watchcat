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

if [ -e $RELEASE_PATH.zip ]
then
    rm $RELEASE_PATH.zip
fi

yarn build && cp -r watchcat/build $RELEASE_PATH/build

cp -r src $RELEASE_PATH
cp index.js $RELEASE_PATH
cp package.json $RELEASE_PATH
cp .env $RELEASE_PATH
cp env.js $RELEASE_PATH
cp README.md $RELEASE_PATH

cp -r bot $RELEASE_PATH
rm -r $RELEASE_PATH/bot/node_modules
rm $RELEASE_PATH/bot/config/config.json

# Compose export zip

cd releases
zip -rq "$RELEASE_NAME.zip" $RELEASE_NAME
rm -r $RELEASE_NAME
cd ..

# Write the installer script

cat installer/install_header.txt > releases/install.sh
echo $PKG_VERSION >> releases/install.sh
cat installer/install_body.txt >> releases/install.sh

# Copy service files

cp installer/watchcatbot.service releases/
cp installer/watchcatpanel.service releases/