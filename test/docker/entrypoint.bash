#!/usr/bin/env bash

cd /data

echo "Cleaning, then installing..." 
(cd mock && npm run clean && npm install)
npm run clean && npm install

echo "Running tests..."
DEBUG=openapi-cop:* npm test
