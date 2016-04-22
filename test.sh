#!/bin/bash

echo 'Code standards:'
grunt validate

echo 'Integration tests:'
./node_modules/.bin/mocha
