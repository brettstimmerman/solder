#! /usr/bin/env node
require.paths.unshift(__dirname + '/../lib');
require.paths.unshift(__dirname + '/../deps');

var cli = require('solder/cli').create();

try {
  cli.run();
} catch (err) {
  console.log(err.message);
}
