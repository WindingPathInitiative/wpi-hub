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
	 * Inserts a new row and immediately updates it with a path.
	 * @param {function} transaction Callback for transacting.
	 * @return {Promise}
	 */
	insertWithPath: function( transaction ) {
		// Throw if no parent path exists.
		if ( ! this.has( 'parentPath' ) ) {
			throw new Error( 'No parent path set' );
		}

		// If we don't have a transaction already, wrap it in one.
		if ( ! transaction ) {
			return bookshelf.transaction( t => {
				return this.insertWithPath( t );
			});
		}

		// Appends the delimiter to the parent path.
		if ( ! _.endsWith( '.', this.get( 'parentPath' ) ) ) {
			this.set( 'parentPath', this.get( 'parentPath' ) + '.' );
		}

		// Save the new model and then update the path.
		return this
		.save( null, { method: 'insert', transacting: transaction } )
		.then( model => {
			let path = model.get( 'parentPath' ) + model.id;
			return model
			.save( { parentPath: path }, { transacting: transaction, patch: true } );
		});
	},

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
		return this;
	}
});

module.exports = Base;
