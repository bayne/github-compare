module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    concat: {
      options: {
        separator: ';'
      },
      dist: {
        src: ['app/**/*.js', 'components/**/*.js'],
        dest: 'js/<%= pkg.name %>.js'
      }
    },
    bower: {
      install: {
      },
      options: {
        copy: false
      }
    },
    bowerInstall: {
      target: {
        src: ['index.html'],
        include: ['bower_components/angular-oauthio/dist/angular-oauth.io.js']
      }
    },
    jshint: {
      files: ['Gruntfile.js', 'app/**/*.js', 'components/**/*.js'],
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
      tasks: ['concat', 'jshint', 'bowerInstall']
    },
    connect: {
      server: {
        options: {
           port: 8001,
           hostname: '*',
           base: '.'
        }
      }
    },
  });

  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-bower-install');
  grunt.loadNpmTasks('grunt-bower-task');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-connect');

  grunt.registerTask('default', ['jshint', 'concat', 'bower', 'bowerInstall']);
  grunt.registerTask('dev', ['connect', 'watch', 'bower', 'bowerInstall']);

};
