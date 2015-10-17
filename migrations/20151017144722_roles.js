
exports.up = ( knex, Promise ) => {
	return knex.schema.createTable( 'roles', ( table ) => {

		table.increments().primary();
		table.string( 'name' ).notNull();

	});
};

exports.down = ( knex, Promise ) => {
	return knex.schema.dropTable( 'roles' );
};
