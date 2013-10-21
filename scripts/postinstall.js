#!/usr/bin/env node

var exec = require('child_process').exec,
    async = require('async');

if (process.env.optionalDependencies) {
  var pkg = require('../package.json');

  var deps = [];
  for (var dep in pkg.optionalDependencies) {
    deps.push(dep);
  }


  async.each(deps, function(p, callback) {
    exec('npm install ' + p + '@' + pkg.optionalDependencies[p], function (err, stdout, stderr) {
      if(err) {
        console.log('Error installing ' + dependency);
        console.log('Please use `npm install ' + dependency + ' and install the package manually');
      } else {
        console.log(stderr);
      }
      callback(err);
    });
  }, function(err) {
    if(err) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  });
}