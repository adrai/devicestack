var _ = require('lodash');

function Command() {
  var self = this;

  this.args = arguments;
  if (arguments.length === 1 && _.isArguments(arguments[0])) {
    this.args = _.toArray(arguments[0]);
  }

  if (this.log) {
    this.log = _.wrap(this.log, function(func, msg) {
      func(self.constructor.name + ': ' + msg);
    });
  } else if (Command.prototype.log) {
    Command.prototype.log = _.wrap(Command.prototype.log, function(func, msg) {
      func(self.constructor.name + ': ' + msg);
    });
    this.log = Command.prototype.log;
  }
}

/**
 * Executes this command.
 * @param  {Connection} connection The connection object.
 * @param  {Function}   callback   The function, that should be called when the command's answer is received.
 *                                 `function(err){}`
 */
Command.prototype.execute = function(connection, callback) {
  connection.executeCommand(this, callback);
};

/**
 * If the initialize function is present it will pass in the arguments passed in the constructor.
 * If necessary for validation reason the initialize function can throw errors.
 */
Command.prototype._initialize = function() {
  if (this.initialize) {
    this.initialize.apply(this, _.toArray(this.args));
  }
};

module.exports = Command;