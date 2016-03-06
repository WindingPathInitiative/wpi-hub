/**
 * Grunt dev helper and validator.
 * @author Ephraim Gregor
 */

module.exports = ( grunt ) => {
	'use strict';

	const APP_JS = [ 'common', 'config', 'models', 'migrations', 'seeds', 'modules', '.' ].map( i => i + '/*.js' );

	grunt.initConfig({
		watch: {
			options: {
				spawn: false,
				livereload: true
			},
			js: {
				files: APP_JS,
				tasks: [ 'jshint', 'jscs' ]
			},
			css: {
				files: 'public/stylesheets/*.css',
				tasks: [ 'csslint' ]
			}
		},

		jshint: {
			app: {
				options: {
					esnext: true,
					node: true
				},
				files: {
					src: APP_JS
				}
			},
			frontend: {
				options: {
					browser: true
				},
				files: {
					src: [ 'public/javascripts/**/*.js' ]
				}
			},
			options: {
				strict: true,
				reporter: require( 'jshint-stylish' )
			}
		},
		jscs: {
			all: APP_JS
		},

		csslint: {
			all: {
				options: {
					import: 2,
					csslintrc: '.csslintrc'
				},
				src: [ 'public/stylesheets/*.css' ]
			}
		}
	});

	// Sets watch to prevent exit.
	grunt.event.on( 'watch', function() {
		grunt.option( 'force', true );
	});

	require( 'load-grunt-tasks' )( grunt );

	grunt.registerTask( 'default', [ 'watch' ] );
};
