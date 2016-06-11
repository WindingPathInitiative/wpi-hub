'use strict';

const cors = require( 'cors' );
const _    = require( 'lodash' );
const url  = require( 'url' );

let clients = require( '../config/clients.json' );

const domains = _( clients ).values().map( key => {
	let domain = url.parse( key );
	return domain.protocol + '//' + domain.host;
}).value();

module.exports = cors({
	origin: domains,
	credentials: true
});
