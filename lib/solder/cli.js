/*global exports: true, process: true, require: true */
/*jslint onevar: true, undef: true, nomen: true, eqeqeq: true, bitwise: true, newcap: true, immed: true */
var fs       = require('fs'),
    optparse = require('optparse'),
    path     = require('path'),

    mkdirp  = require('mkdir-p'),
    solder  = require('solder'),
    version = require('solder/version');

function CLI() {
  this.options = this.getDefaultOptions();
  this.initOptionParser();
  this.optionProvided = false;
}

CLI.prototype.run = function () {
  var args = this.optionParser.parse(process.ARGV);

  if (args) {
    args = args.slice(2); // ignore path/to/[node|solder]

    if (args.length === 0 && !this.optionProvided) {
      require('solder/server').start(this.options);
    }
    else {
      if (args.length === 0 && this.optionProvided) {
        this.printOptionError('No components specified');
      }
      else {
        this.processComponents(args, function (err) {
          if (err) {
            console.log(err.message);
          }
        });
      }
    }
  }
};

// -- Protected --------------------------------------------------------------

CLI.prototype.getFilenameSuffix = function (minify) {
  function pad(num) {
    return ((num + '').length < 2 ? '0': '') + num;
  }

  var date  = new Date(),
      year  = date.getFullYear(),
      month = pad(date.getMonth() + 1), // getMonth returns 0-11
      day   = pad(date.getDate()),
      hour  = pad(date.getHours()),
      min   = pad(date.getMinutes());

  return ['-', year, month, day, hour, min, (minify ? '-min' : '')].join('');
};

CLI.prototype.getOptionSwitches = function () {
  return [
    ['-c', '--config PATH',     'Use the specified configuration file'],
    ['--no-minify',             "Don't perform any minification"],
    ['-o', '--output-dir PATH', 'Write soldered files to the specified directory'],
    ['--port PORT',             'Listen on the specified port (server-mode only)'],
    ['-p', '--push',            'Push soldered files to the configured CDN instead of saving them locally'],
    ['-t', '--type TYPE',       "Only solder components of the specified type ('css' or 'js')"],
    ['-h', '--help',            'Print help (this message) and exit'],
    ['-v', '--version',         'Print version information and exit']
  ];
};

CLI.prototype.initOptionParser = function () {
  var parser = new optparse.OptionParser(this.getOptionSwitches()),
      self   = this;

  this.optionParser = parser;

  parser.banner = '' +
version.version.APP_NAME + ' combines and minifies JavaScript and CSS at runtime and build time\n' +
'\n' +
'Usage:\n' +
'  solder [options] [<component> ...]';

  parser.on('config', function (opt, value) {
    self.options.configFile = value;
    self.optionProvided = true;
  });

  parser.on('help', function () {
    self.printAndHalt(parser.toString());
  });

  parser.on('no-minify', function () {
    self.options.minify = false;
    self.optionProvided = true;
  });

  parser.on('output-dir', function (opt, value) {
    self.options.outputDir = value;
  });

  parser.on('port', function (opt, value) {
    if (/^[0-9]{4,5}$/.test(value) === false) {
      self.printOptionError('Invalid port number: ' + value);
    }

    self.options.port = parseInt(value, 10);
  });

  parser.on('push', function () {
    self.options.push = true;
    self.optionProvided = true;
  });

  parser.on('type', function (opt, value) {
    if (value !== 'css' && value !== 'js') {
      self.printOptionError('Unsupported component type: ' + value);
    }

    self.options.types = [value];
    self.optionProvided = true;
  });

  parser.on('version', function () {
    self.printAndHalt(version.toString());
  });

  parser.on(function (opt) {
    self.printOptionError('Unrecognized option: ' + opt);
  });

  return parser;
};

CLI.prototype.printAndHalt = function (message) {
  console.log(message);
  this.optionParser.halt();
};

CLI.prototype.printOptionError = function (message) {
  this.printAndHalt(message + '\nTry --help for help');
};

CLI.prototype.processComponent = function (component, callback) {
  var suffix = this.getFilenameSuffix(this.options.minify),
      self   = this;

  this.options.types.forEach(function (type) {
    self.processComponentForType(component, type, suffix, function (err) {
      if (err) { callback(err); }
    });
  });
};

CLI.prototype.processComponentForType = function (component, type, suffix, callback) {
  if (!component[type]) {
    return;
  }

  var action   = this.options.minify ? 'compress' : 'merge',
      filename = component.name + suffix + '.' + type,
      self     = this;

  component[action](type, (function (filename, type, callback) {
    return function (err, content) {
      if (err) {
        return callback(err);
      }

      if (self.options.push) {
        component.push(filename, type, content, function (err, url) {
          if (err) {
            return callback(err);
          }

          console.log('-->', url);
        });
      }
      else {
        var outputDir = self.options.outputDir,
            fullPath  = path.join(outputDir, filename);

        mkdirp(outputDir, 0755, function (err) {
          if (err) {
            return callback(err);
          }

          fs.writeFile(fullPath, content, function (err) {
            if (err) {
              return callback(err);
            }

            console.log('-->', fullPath);
          });
        });
      }
    };
  }(filename, type, callback)));
};

CLI.prototype.processComponents = function (componentNames, callback) {
  var solderer = solder.create(this.options.configFile),
      self     = this;

  componentNames.forEach(function (name) {
    self.processComponent(solderer.component(name), function (err) {
      if (err) { callback(err); }
    });
  });
};

CLI.prototype.getDefaultOptions = function () {
  return {
    configFile : './solder-config.js',
    outputDir  :  '.',
    types      : ['css', 'js'],
    minify     : true,
    port       : 8675,
    push       : false
  };
};

// -- Exports ----------------------------------------------------------------

exports.create = function () {
  return new CLI();
};
