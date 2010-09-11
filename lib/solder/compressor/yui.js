/*global exports: true, require: true */
/*jslint onevar: true, undef: true, nomen: true, eqeqeq: true, bitwise: true, newcap: true, immed: true */
var path = require('path'),

    compressor = require('solder/compressor');

function YUICompressor(type, options) {
  this.name    = 'yui';
  this.type    = type;
  this.options = options;

  if (!options.jar) {
    throw new Error('YUI Compressor jar file not specified');
  }

  path.exists(options.jar, function (exists) {
    if (!exists) {
      throw new Error('YUI Compressor jar file not found: ' + options.jar);
    }
  });
}

YUICompressor.prototype = compressor.createCompressor();

YUICompressor.prototype.compress = function (input, callback) {
  var command = 'java -jar {jar} {input} -o {output}';
  this.compressFS(command, input, callback);
};

// -- Exports ----------------------------------------------------------------

exports.create = function (type, options) {
  return new YUICompressor(type, options);
};
