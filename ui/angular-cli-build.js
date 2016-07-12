/* global require, module */

var Angular2App = require('angular-cli/lib/broccoli/angular2-app');

module.exports = function(defaults) {
  return new Angular2App(defaults, {
    vendorNpmFiles: [
      'systemjs/dist/system-polyfills.js',
      'systemjs/dist/system.src.js',
      'zone.js/dist/**/*.+(js|js.map)',
      'es6-shim/es6-shim.js',
      'reflect-metadata/**/*.+(js|js.map)',
      'rxjs/**/*.+(js|js.map)',
      '@angular/**/*.+(js|js.map)',
      'jquery/dist/jquery.min.js',
      'tether/dist/js/tether.min.js',
      'bootstrap/dist/js/bootstrap.min.js',
      'markdown-it/dist/markdown-it.min.js',
      'autosize/dist/autosize.min.js',
      'ng2-bootstrap/**/*.js',
      'moment/moment.js',
      'angular2-toaster/**/*.+(js|js.map|css)',
      'favico.js/favico.js'
    ]
  });
};
