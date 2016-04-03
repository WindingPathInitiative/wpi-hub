'use strict';

const Offices  = require( '../models/offices' );
const Users    = require( '../models/users' );
const OrgUnits = require( '../models/org_units' );

exports.has = ( permission, officer ) => {};

exports.hasOverUser = ( user, permission, officer ) => {};

exports.hasOverUnit = ( unit, permission, officer ) => {};

function normalizeOfficer( officer ) {

}

function normalizeRole( role ) {

}
