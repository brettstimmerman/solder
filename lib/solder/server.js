/*global exports: true, require: true */
/*jslint onevar: true, undef: true, nomen: true, eqeqeq: true, bitwise: true, newcap: true, immed: true */
exports.start = function (config) {
  var express = require('express'),
      server  = express.createServer(),

      port     = config.port,
      solder   = require('solder');

  solder.expressRoute(server, config);

  server.get('*', function (req, res) {
    res.send('Not found', 404);
  });

  server.listen(port);
  console.log('Solder server started at http://localhost:'+ port + '/');

  return server;
};
