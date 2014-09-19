module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    concat: {
      options: {
        separator: ';'
      },
      dist: {
        src: ['web/app/**/*.js'],
        dest: 'web/js/<%= pkg.name %>.js'
      }
    },
    bower_concat: {
      all: {
        dest: 'web/js/_bower.js',
      }
    },
    jshint: {
      files: ['Gruntfile.js', 'web/app/**/*.js'],
      options: {
        // options here to override JSHint defaults
        globals: {
          jQuery: true,
          console: true,
          module: true,
          document: true
        }
      }
    },
    watch: {
      files: ['<%= jshint.files %>'],
      tasks: ['bower_concat', 'concat', 'jshint']
    },
    connect: {
      server: {
        options: {
           port: 8001,
           hostname: '*',
           base: 'web',
        }
      }
    },
  });

  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-bower-concat');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-connect');

  grunt.registerTask('default', ['jshint', 'concat', 'bower_concat']);
  grunt.registerTask('dev', ['connect', 'watch']);

};
