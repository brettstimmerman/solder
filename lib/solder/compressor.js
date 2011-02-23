/*global exports: true, require: true */
/*jslint onevar: true, undef: true, nomen: true, eqeqeq: true, bitwise: true, newcap: true, immed: true */
var exec = require('child_process').exec,
    fs   = require('fs'),
    path = require('path');

function Compressor() {}

Compressor.prototype.compress = function (input, callback) {
  callback(input);
};

// Writing to and reading from a temp file sucks. But Node's
// child_process.spawn() doesn't seem to like jars.
Compressor.prototype.compressFS = function (command, input, callback) {
  var tmpName = this.tmpName(this.name),
      inFile  = tmpName + '.' + this.type,
      outFile = tmpName + '-min.' + this.type,
      self = this;

  fs.writeFile(inFile, input, 'utf-8', function (err) {
    if (err) {
      return callback(err, null);
    }
    command = command.replace(/\{jar\}/g, self.options.jar).replace(/\{bin\}/g, self.options.bin)
        .replace(/\{input\}/g, inFile).replace(/\{output\}/g, outFile);

    exec(command, function (err, stdout, stderr) {
      if (err) {
        return callback(err);
      }
      
      fs.readFile(outFile, function (err, data) {
        if (err) {
          return callback(err);
        }

        callback(null, data + '\n');

        fs.unlink(inFile, function () {
          fs.unlink(outFile);
        });
      });
    });
  });
};

Compressor.prototype.tmpName = function (prefix) {
  prefix = prefix || 'solder';

  return '/tmp/' + prefix + '-' + (new Date()).getTime() + '-' +
      Math.floor(Math.random() * 10e4);
};

// -- Exports ----------------------------------------------------------------

exports.create = function (name, type, config) {
  var compressor;

  if (name === 'yui') {
    compressor = require('solder/compressor/yui').create(type, config);
  }
  else if (name === 'closure') {
    compressor = require('solder/compressor/closure').create(type, config);
  }
  else if (name === 'scss') {
    compressor = require('solder/compressor/scss').create(type, config);
  }
  else if (name === 'jslint') {
    compressor = require('solder/compressor/jslint').create(type, config);
  }

  return compressor;
};

exports.createCompressor = function () {
  return new Compressor();
};
