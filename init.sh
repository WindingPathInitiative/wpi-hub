#!/bin/bash

echo 'Delaying for MySQL.'
sleep 10

echo 'Running migration.'
knex migrate:latest

echo 'Inserting seed data.'
knex seed:run

echo 'Starting application.'
nodemon www
