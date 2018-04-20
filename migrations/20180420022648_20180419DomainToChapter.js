
exports.up = function(knex, Promise) {
	return knex.schema.alterTable('org_units', (table) => {
		var unitTypes = [ 'Venue', 'Chapter', 'Domain', 'Region', 'Nation' ];
		table.enum('type',unitTypes).alter();
	}).then(() => {
		return knex('org_units')
		.where('type', '=', 'Domain')
		.update({
		  type: 'Chapter',
		});
	}).then(() =>{
		return knex.schema.alterTable('org_units', (table) => {
			var unitTypes = [ 'Venue', 'Chapter', 'Region', 'Nation' ];
			table.enum('type',unitTypes).alter();
		});
	}).then(() => {
		return knex('offices')
		.where('roles', 'LIKE', '%domain%')
		.update({
		  roles: knex.raw('REPLACE(roles, ?, ?)', ['domain','chapter']),
		});
	});
};

exports.down = function(knex, Promise) {
	return knex.schema.alterTable('org_units', (table) => {
		var unitTypes = [ 'Venue', 'Chapter', 'Domain', 'Region', 'Nation' ];
		table.enum('type',unitTypes).alter();
	}).then(() => {
		return knex('org_units')
		.where('type', '=', 'Chapter')
		.update({
		  type: 'Domain',
		});
	}).then(() =>{
		return knex.schema.alterTable('org_units', (table) => {
			var unitTypes = [ 'Venue', 'Domain', 'Region', 'Nation' ];
			table.enum('type',unitTypes).alter();
		});
	}).then(() => {
		return knex('offices')
		.where('roles', 'LIKE', '%chapter%')
		.update({
		  roles: knex.raw('REPLACE(roles, ?, ?)', ['chapter','domain']),
		});
	});
};
