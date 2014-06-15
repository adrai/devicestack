var _ = require('lodash'),
    tv4 = require('tv4'),
    ValidationError = require('./errors/validationError');

function Task() {
  var self = this;

  this.args = arguments;
  if (arguments.length === 1 && _.isArguments(arguments[0])) {
    this.args = arguments[0];
  }

  if (this.log) {
    this.log = _.wrap(this.log, function(func, msg) {
      func(self.constructor.name + ': ' + msg);
    });
  } else if (Task.prototype.log) {
    Task.prototype.log = _.wrap(Task.prototype.log, function(func, msg) {
      func(self.constructor.name + ': ' + msg);
    });
    this.log = Task.prototype.log;
  } else {
    var debug = require('debug')(this.constructor.name);
    this.log = function(msg) {
      debug(msg);
    };
  }
}

/**
 * If the initialize function is present it will pass in the arguments passed in the constructor.
 * If necessary for validation reason the initialize function can throw errors.
 *
 * @param  {Connection} connection The connection object.
 */
Task.prototype._initialize = function(connection) {
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

Task.prototype.perform = function(connection, callback) {
  throw new Error('Implement the perform function!');
};

/**
 * Executes this task or an other task or a command.
 * 
 * @param  {Function}   callback   The function, that should be called when the task's or command's answer is received.
 *                                 `function(err, res){}`
 *
 * @example:
 *     this.execute(myTask, connection, false, function(err, res) {});
 *     // or
 *     this.execute(myTask, connection, function(err, res) {});
 *     // or
 *     this.execute(myCommand, connection, function(err, res) {});
 *     // or
 *     this.execute(connection, true, function(err, res) {});
 *     // or
 *     this.execute(connection, function(err, res) {});
 */
Task.prototype.execute = function(taskOrCommand, connection, ignoreQueue, callback) {
  if (arguments.length === 2) {

    ignoreQueue = false;
    callback = connection;
    connection = taskOrCommand;
    taskOrCommand= null;

  } else if (arguments.length === 3 && _.isBoolean(connection)) {

    callback = ignoreQueue;
    ignoreQueue = connection;
    connection = taskOrCommand;
    taskOrCommand= null;

  } else if (arguments.length === 3 && !_.isBoolean(connection)) {

    callback = ignoreQueue;
    ignoreQueue = true;

  }

  if (taskOrCommand && taskOrCommand instanceof Task) {

    if (this.log) { this.log('Start executing TASK: ' + taskOrCommand.constructor.name); }
    connection.executeTask(taskOrCommand, ignoreQueue, callback);

  } else if (taskOrCommand) {

    if (this.log) { this.log('Start executing COMMAND: ' + taskOrCommand.constructor.name); }
    taskOrCommand.execute(connection, callback);

  } else {

    if (this.log) { this.log('Start executing...'); }
    connection.executeTask(this, ignoreQueue, callback);

  }
};

module.exports = Task;