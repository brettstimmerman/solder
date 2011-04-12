/*global __dirname: true, exports: true, process: true, require: true */
/*jslint onevar: true, undef: true, nomen: true, eqeqeq: true, bitwise: true, newcap: true, immed: true */

var fs        = require('fs'),
    path      = require('path');

require.paths.unshift(__dirname);
require.paths.unshift(path.normalize(__dirname + '/../deps'));

var cache     = require('solder/cache'),
    Component = require('solder/component'),
    version   = require('solder/version');


function Solderer (configFile) {
  configFile = configFile || './solder-config.js';

  try {
    this.config = require(fs.realpathSync(configFile)).config;
  } catch (e) {
    throw new Error('Missing or invalid configuration file: ' + fs.realpathSync(configFile)+ ' | error was '+e);
  }

  this.cache          = cache.create();
  this.cdn            = null;
  this.componentCache = {};
}

Solderer.prototype.component = function (name) {
  var css  = [],
      js   = [],
      compressors = [],
      self = this,
      component, definition, requires;

  if (this.componentCache[name]) {
    return this.componentCache[name];
  }

  definition = this.config.components[name];

  if (!definition) {
    throw new Error('Component not found: ' + name);
  }

  requires = definition.requires || [];

  // TODO: Resolve dependency chains and cyclical dependencies
  requires.forEach(function (name) {
    component = self.component(name);
    css       = css.concat(component.css);
    js        = js.concat(component.js);
  });

  css = css.concat(definition.css || []);
  js  = js.concat(definition.js || []);
  compressors  = compressors.concat(definition.compressors || []);

  component = this.componentCache[name] = Component.create(this, name,
      {css: css, js: js, requires: requires,compressors:compressors}
  );

  return component;
};

Solderer.prototype.solder = function (options, callback) {
  exports.solder(this, options, callback);
};

// -- Exports ----------------------------------------------------------------

exports.HOME_DIR = (process.env.SOLDER_HOME || process.env.HOME).replace(/^~/,
    process.env.HOME) || process.cwd();

exports.urlPattern     = /^\/solder\/([^\/]+)\.(css|js)(?:\?([^#]+))?/i;
exports.expressPattern = /^\/solder\/([^\/]+)\.(css|js)$/i;

exports.create = function (configFile) { return new Solderer(configFile); };

exports.createServer = function (config) {
  return require('solder/server').start(config);
};

exports.expressRoute = function (server, config) {
  config = config || {};

  var pattern  = config.urlPattern || exports.expressPattern,
      solderer = config.solderer || exports.create(config.configFile);

  server.get(pattern, function (req, res) {
    var options = {
      name    : req.params[0],
      type    : req.params[1],
      nominify: req.query.hasOwnProperty('no-minify') ||
          req.query.hasOwnProperty('nominify')
    };

    solderer.solder(options, function(err, content, headers) {
      if (err) {
        console.log(err.message);
        res.send('/* ' + err.message + ' */', 500);
      }
      else {
        res.send(content, headers);
      }
    });
  });
};

exports.solder = function(solderer, options, callback) {
  var name        = options.name,
      type        = options.type,
      nominify    = options.nominify || false,
      action      = nominify ? 'merge' : 'compress',
      contentType = type === 'css' ? 'text/css' : 'application/javascript',
      headers     = {
        'Content-Type': contentType + ';charset=utf-8',
        'X-Solder'    : version.toString()
      };

  solderer.component(name)[action](type, function (err, content) {
    if (err) {
      return callback(err);
    }

    callback(null, content, headers);
  });
};
