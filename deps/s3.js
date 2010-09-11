/*global exports: true, require: true */
/*jslint onevar: true, undef: true, nomen: true, eqeqeq: true, bitwise: true, newcap: true, immed: true */

// Minimal Amazon S3 driver for PUT requests of the not enormous variety.

/*
Copyright (c) 2010 Brett Stimmerman <brettstimmerman@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the 'Software'), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

var crypto = require('crypto'),
    http   = require('http'),
    url    = require('url');

function S3(accessKeyId, secretAccessKey, options) {
  this.options = options || {};

  this.accessKeyId     = accessKeyId;
  this.secretAccessKey = secretAccessKey;
  this.storageType     = this.options.storageType || 'STANDARD';

  this.hostname = url.parse(this.options.urlBase).hostname;
}

S3.prototype.put = function (path, headers, body, callback) {
  headers = headers || {};

  headers.Date              = (new Date()).toUTCString();
  headers['Content-Length'] = body.length;
  headers['Content-MD5']    = crypto.createHash('md5').update(body).digest('base64');
  headers['Content-Type']   = headers['Content-Type'] || 'binary/octet-stream';
  headers.Host              = this.hostname;
  headers['x-amz-acl']      = headers['x-amz-acl'] || 'private';
  headers['x-amz-storage-class'] = this.storageType;

  headers.Authorization = this.getAuthorization('PUT', path, headers);

  var amazon  = http.createClient(80, this.hostname),
      request = amazon.request('PUT', path, headers),
      self    = this;

  request.on('response', function (response) {
    if (response.statusCode !== 200) {
      if (response.statusCode === 403) {
        return callback(new Error('Amazon S3: Authorization failed (HTTP 403)'));
      }

      return callback(new Error('Amazon S3: PUT request returned HTTP status ' + response.statusCode));
    }

    callback(null, self.options.urlBase + path);
  });

  request.end(body, 'utf8');
};

// -- Protected --------------------------------------------------------------

S3.prototype.getAmzHeaders = function (headers) {
  var amzHeaders = [],
      regex      = /^x-amz-/i,
      header, value;

  for (header in headers) {
    if (headers.hasOwnProperty(header) && regex.test(header)) {
      value = headers[header];

      if (value instanceof Array) {
        value = value.join(',');
      }

      amzHeaders.push(header.toString().toLowerCase() + ':' + value);
    }
  }

  return amzHeaders.sort().join('\n');
};

S3.prototype.getAuthorization = function (verb, path, headers) {
  var signature = this.getSignature(verb, path, headers);

  return 'AWS ' + this.accessKeyId + ':' + signature;
};

S3.prototype.getSignature = function (verb, path, headers) {
  var amzHeaders   = this.getAmzHeaders(headers),
      stringToSign = this.getStringToSign(headers, verb, amzHeaders, path);

  return crypto.createHmac('sha1',
      this.secretAccessKey).update(stringToSign).digest('base64');
};

S3.prototype.getStringToSign = function (headers, verb, amzHeaders, path) {
  var resource    = '/' + this.options.bucket + path,
      contentType = headers['Content-Type'] || '',
      md5         = headers['Content-MD5'] || '',
      date, stringToSign;

  if (amzHeaders.indexOf('x-amz-date') === -1) {
    date = headers.Date || (new Date()).toUTCString();
  }

  stringToSign =  '' +
    verb + '\n' +
    md5  + '\n' +
    contentType + '\n' +
    date + '\n' +
    (amzHeaders ? amzHeaders + '\n' : '') +
    resource;

  return stringToSign;
};

// -- Exports ----------------------------------------------------------------

exports.create = function (accessKeyId, secretAccessKey, options) {
  return new S3(accessKeyId, secretAccessKey, options);
};
