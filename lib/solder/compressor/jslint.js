/*global exports: true, require: true */
/*jslint onevar: true, undef: true, nomen: true, eqeqeq: true, bitwise: true, newcap: true, immed: true */
var path = require('path'),

    compressor = require('solder/compressor');

function JSLINTCompressor(type, options) {
  this.name    = 'jslint';
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
  var command = 'jslint {input}';
  this.execCommand(command, input, function(error,stdout,stderr) {
      if (stdout || stderr) {
          console.log("JSLINT output for "+input);
          console.log(stdout);
          console.log(stderr);
      }
  });
};

// -- Exports ----------------------------------------------------------------

exports.create = function (type, options) {
  return new JSLINTCompressor(type, options);
};
