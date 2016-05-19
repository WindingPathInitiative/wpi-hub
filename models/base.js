'use strict';

/**
 * Base model.
 *
 * Doesn't actually define anything, but is an abstract class.
 */
const bookshelf = require( '../helpers/db' ).Bookshelf;
const _         = require( 'lodash' );

const Base = bookshelf.Model.extend({

	showFull: false,
	publicAttrs: [],

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
		return this.set( attrs, _.extend( {}, options, { unset: true } ) );
	},

	/**
	 * Serializes the data.
	 * @param {Object} options Options for parent.
	 * @return {Object}
	 */
	serialize: function( options ) {
		let attrs = bookshelf.Model.prototype.serialize.apply( this, arguments );
		if ( this.publicAttrs.length && ! this.showFull ) {
			attrs = _.pick( attrs, this.publicAttrs );
		}
		return attrs;
	},

	/**
	 * Shows all data data.
	 * @return {void}
	 */
	show: function() {
		this.showFull = true;
	}
});

module.exports = Base;
