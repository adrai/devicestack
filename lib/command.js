var _ = require('lodash'),
    tv4 = require('tv4'),
    ValidationError = require('./errors/validationError');

function Command() {
  var self = this;

  this.args = arguments;
  if (arguments.length === 1 && _.isArguments(arguments[0])) {
    this.args = arguments[0];
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
  } else {
    var debug = require('debug')(this.constructor.name);
    this.log = function(msg) {
      debug(msg);
    };
  }
}

/**
 * Executes this command.
 * 
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
 *
 * @param  {Connection} connection The connection object.
 */
Command.prototype._initialize = function(connection) {
  if (this.initialize) {
    var args = _.toArray(this.args);

    if (this.argumentsSchema) {
      var validation = tv4.validateResult(args, this.argumentsSchema);
      
      if (validation.missing.length > 0) {
        throw new Error('Validation schema "' + validation.missing[0] + '" missing!');
      }

      if (!validation.valid) {
        if (validation.error.subErrors && validation.error.subErrors.length > 0) {
          validation.error.subErrors = _.sortBy(validation.error.subErrors, function(s) {
            return -s.code;
          });
          throw new ValidationError(validation.error.subErrors[0].dataPath + ' => ' + validation.error.subErrors[0].message);
        } else {
          throw new ValidationError(validation.error.dataPath + ' => ' + validation.error.message);
        }
      }
    }

    this.initialize.apply(this, [connection].concat(args));
  }
};

module.exports = Command;