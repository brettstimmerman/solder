/*global exports: true */
exports.version = {
  APP_NAME      : 'Solder',
  APP_VERSION   : '0.0.2'
};

exports.toString = function () {
  var v = exports.version;

  return v.APP_NAME + ' ' + v.APP_VERSION;
};

exports.userAgent = function () {
  var v = exports.version;

  return v.APP_NAME + '/' + v.APP_VERSION;
};
