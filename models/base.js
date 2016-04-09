'use strict';

/**
 * Base model.
 *
 * Doesn't actually define anything, but is an abstract class.
 */
const bookshelf = require( '../helpers/db' ).Bookshelf;
const _         = require( 'lodash' );

const Base = bookshelf.Model.extend({
	/**
	 * Extends unset to handle arrays.
	 * @param  {mixed}  attrs   Array or string.
	 * @param  {Object} options Options.
	 * @return {Object}
	 */
	unset: function( attrs, options ) {
		if ( ! _.isArray( attrs ) ) {
			attrs = [ attrs ];
		}
		attrs = _.fromPairs( _.map( attrs, attr => [ attr, undefined ] ) );
		console.log( attrs );
		return this.set( attrs, _.extend( {}, options, { unset: true } ) );
	}
});

module.exports = Base;
