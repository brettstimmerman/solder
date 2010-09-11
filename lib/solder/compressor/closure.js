/*global exports: true, require: true */
/*jslint onevar: true, undef: true, nomen: true, eqeqeq: true, bitwise: true, newcap: true, immed: true */
var path = require('path'),

    compressor = require('solder/compressor');

function Closure(type, options) {
  this.type    = type;
  this.options = options;
  this.args    = options.args;

  if (this.type !== 'js') {
    throw new Error('Closure Compiler only supports JavaScrtipt');
  }

  if (!options.jar) {
    throw new Error('Closure Compiler jar file not specified');
  }

  path.exists(options.jar, function (exists) {
    if (!exists) {
      throw new Error('Closure Compiler jar file not found: ' + options.jar);
    }
  });
}

Closure.prototype = compressor.createCompressor();

Closure.prototype.compress = function (input, callback) {
  var command = 'java -jar {jar} --js {input} --js_output_file {output}';
  this.compressFS(command, input, callback);
};

// -- Exports ----------------------------------------------------------------

exports.create = function (type, options) {
  return new Closure(type, options);
};
