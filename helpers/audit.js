'use strict';

const Promise  = require( 'bluebird' );
const request  = Promise.promisify( require( 'request' ) );
const isEmpty  = require( 'lodash' ).isEmpty;

const config    = require( '../config' ).audit;
const version   = require( '../package' ).version;
const UserError = require( './errors' );

/**
 * Saves an audit message.
 * @param {Object} req           Request object.
 * @param {String} message       Message to save.
 * @param {Array}  [refs]     Array of objects that are references.
 * @param {Object} [metadata] Object of metadata to save.
 * @param {String} [delta]    Text of delta change.
 * @return {Promise}
 */
module.exports = function( req, message, refs = [], metadata = {}, delta = '' ) {
	if ( ! config || ! config.host ) {
		return Promise.reject( new UserError( 'Config not set', 500 ) );
	}

	if ( 'bypass' === config.host || 'testing' === req.app.get( 'env' ) ) {
		return Promise.resolve( false );
	}

	if ( ! req.user ) {
		return Promise.reject( new UserError( 'User data not provided', 500 ) );
	}

	let body = {
		userId: req.user.get( 'id' ),
		service: 'user-hub-v' + version.split( '.' ).shift(),
		message,
		occurredAt: Date.now()
	};

	if ( metadata.office ) {
		body.officeId = metadata.office.id;
	}
	if ( ! isEmpty( metadata ) ) {
		body.metadata = metadata;
	}
	if ( ! isEmpty( delta ) ) {
		if ( 'String' !== typeof delta ) {
			delta = JSON.stringify( delta );
		}
		body.delta = delta;
	}

	if ( 'Array' !== typeof refs ) {
		refs = [ refs ];
	}

	body.references = refs.map( ref => {
		if ( 'function' === typeof ref.get ) {
			return {
				'service':  'user-hub',
				'object':   ref.tableName,
				'objectId': ref.get( 'id' )
			};
		} else {
			return ref;
		}
	});

	return request({
		url: config.host,
		method: 'POST',
		json: true,
		body
	})
	.catch( err => {
		return Promise.reject( new UserError( 'Audit error', 500, err ) );
	});
};
