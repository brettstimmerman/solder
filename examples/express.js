/*global require: true */
/*jslint onevar: true, undef: true, nomen: true, eqeqeq: true, bitwise: true, newcap: true, immed: true */

var server = require('express').createServer(),
    solder = require('solder');

// Use expressRoute's optional `config` argument to specify a custom URL
// matching regular expression, or to use an existing Solder instance.
//
//    solder.expressRoute(server, {urlPattern: ..., solderer: ...});
//
solder.expressRoute(server);

server.listen(3000);
console.log('Solder Express example running at http://localhost:3000/');