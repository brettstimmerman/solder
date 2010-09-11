/*global exports: true, process: true, require: true */
/*jslint onevar: true, undef: true, nomen: true, eqeqeq: true, bitwise: true, newcap: true, immed: true */
var crypto   = require('crypto'),
    fs       = require('fs'),
    glob     = require('glob'),
    path     = require('path'),

    mkdirp   = require('mkdir-p'),
    solder   = require('solder');

function Cache() {
  var self = this;

  this.CACHE_DIR = solder.HOME_DIR + '/.solder';

  mkdirp(this.CACHE_DIR, 0755, function (err) {
    if (err) { throw err; }

    self.purgeExpired();
  });
}

Cache.prototype.fetch = function (key, callback) {
  var now     = Math.floor((new Date()).getTime() / 1000),
      pattern = this.CACHE_DIR + '/solder.*.' + this.keyHash(key),
      self    = this;

  glob.glob(pattern, 0, function (err, files) {
    if (err) {
      return callback(err);
    }

    if (!files.length) {
      return callback(null, null);
    }

    files.forEach(function (filename) {
      var meta = self.parseFilename(filename);

      if (meta && meta.expires <= now) {
        fs.unlink(filename);
        callback(null, null);
      }
      else {
        fs.readFile(filename, function (err, data) {
          if (err) {
            return callback(err);
          }

          callback(null, data);
        });
      }
    });
  });
};

Cache.prototype.store = function (key, value, expires, callback) {
  expires = expires || Math.floor((new Date()).getTime() / 1000) + 1800;

  var filename = path.join(this.CACHE_DIR, 'solder.' + expires + '.' +
          this.keyHash(key));

  fs.writeFile(filename, value, function (err) {
    if (err) {
      return callback(err);
    }

    callback(null, value);
  });
};

// -- Protected --------------------------------------------------------------

Cache.prototype.keyHash = function (key) {
  return crypto.createHash('sha1').update(key).digest('hex');
};

Cache.prototype.parseFilename = function (filename) {
  var match = path.basename(filename).match(/^solder\.([0-9]+)\.([0-9a-f]{40})$/),
      expires, hash;

  if (match) {
    expires = parseInt(match[1], 10);
    hash    = match[2];

    return {expires: expires, hash: hash};
  }
};

Cache.prototype.purgeExpired = function () {
  var now  = (new Date()).getTime(),
      self = this;

  glob.glob(this.CACHE_DIR + '/solder.*', 0, function (err, files) {
    if (!err) {
      files.forEach(function (filename) {
        var meta = self.parseFilename(filename);

        if (meta && meta.expires <= now) {
          fs.unlink(path.join(self.CACHE_DIR, filename));
        }
      });
    }
  });
};

// -- Exports ----------------------------------------------------------------

exports.create = function () { return new Cache(); };
