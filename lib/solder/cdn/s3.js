/*global exports: true, process: true, require: true */
/*jslint onevar: true, undef: true, nomen: true, eqeqeq: true, bitwise: true, newcap: true, immed: true */
var gzip = require('gzip').gzip,

    S3 = require('s3');

function SolderS3 (options) {
  this.options = options || {};

  var accessKeyId     = options.accessKeyId     || process.env.AMAZON_ACCESS_KEY_ID,
      secretAccessKey = options.secretAccessKey || process.env.AMAZON_SECRET_ACCESS_KEY;

  this.S3 = S3.create(accessKeyId, secretAccessKey, this.options);
}

SolderS3.prototype.push = function (filename, type, content, callback) {
  var contentType = type === 'css' ? 'text/css' : 'application/javascript',
      prefix      = (this.options.prefix || {})[type] || '',
      headers     = {
        'x-amz-acl'    : 'public-read',
        'Cache-Control': 'public,max-age:315360000',
        'Content-Type' : contentType + ';charset=utf-8',
        'Expires'      : (new Date((new Date()).getTime() + 315360000000)).toUTCString() // +10 years
      },
      self = this;

  function put(content) {
    self.S3.put('/' + prefix + filename, headers, content, function (err, url) {
      if (err) {
        return callback(err);
      }

      callback(null, url);
    });
  }

  if (this.options.gzip) {
    gzip(content, 9, function (err, data) {
      if (err) {
        return callback(err);
      }

      headers['Content-Encoding'] = 'gzip';
      put(data);
    });
  }
  else {
    put(content);
  }
};

// -- Exports ----------------------------------------------------------------

exports.create = function (options) { return new SolderS3(options); };
