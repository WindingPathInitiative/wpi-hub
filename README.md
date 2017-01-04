# Mind's Eye Society User Hub
This system is a REST API designed to handle member and org unit hierarchy and permissions. Designed to interface with the MES Portal via OAuth and configurable clients.

Documentation can be found [here](https://mindseyesociety.github.io/mes-hub/)

[![Dependency Status](https://david-dm.org/MindsEyeSociety/mes-hub.svg)](https://david-dm.org/MindsEyeSociety/mes-hub)
[![Build Status](https://travis-ci.org/MindsEyeSociety/mes-hub.svg?branch=master)](https://travis-ci.org/MindsEyeSociety/mes-hub)

[JIRA (private)](https://mindseyesociety.atlassian.net/secure/RapidBoard.jspa?rapidView=1)

## Installation
1. `npm install`.
2. `npm install -g knex`.
3. Configure the database in `config/db.json`.
4. `knex migrate:latest`.
5. Configure the OAuth tokens in `config/auth.json` and `config/clients.json`.
6. Start server with `node www`.

## Config
* `auth` - Contains OAuth credentials for the Portal server.
* `clients` - Clients, organized via ID : redirect URL.
* `db` - Database credentials.
* `roles` - JSON of valid roles, with descriptions.
* `templates` - Office permission templates, used when creating new org units.

## Tests
Tests are run with Mocha and Supertest. They can be run with `NODE_ENV=testing mocha` locally. `grunt validate` is also used to lint the code.
