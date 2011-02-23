/*global exports: true, require: true */
/*jslint onevar: true, undef: true, nomen: true, eqeqeq: true, bitwise: true, newcap: true, immed: true */
var path = require('path'),

    compressor = require('solder/compressor');

function SCSS(type, options) {
  this.name    = 'scss';
  this.type    = type;
  this.options = options;

  if (!options.bin) {
    options.bin = "/usr/bin/sass";
  }
  
  if (options.bin instanceof Array) {
      for (var i=0;i<options.bin.length;i++) {
          if (path.existsSync(options.bin[i])) {
              options.bin=options.bin[i];
              break;
          }
      }
  }
  
  path.exists(options.bin, function (exists) {
    if (!exists) {
      throw new Error('SASS command not found: ' + options.bin);
    }
  });
}

SCSS.prototype = compressor.createCompressor();

SCSS.prototype.compress = function (input, callback) {
  var command = '{bin} --trace --no-cache --scss {input} {output}';
  this.compressFS(command, input, callback);
};

// -- Exports ----------------------------------------------------------------

exports.create = function (type, options) {
  return new SCSS(type, options);
};
