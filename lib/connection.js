var EventEmitter2 = require('eventemitter2').EventEmitter2,
    util = require('util'),
    _ = require('lodash'),
    uuid = require('node-uuid').v4,
    pm;

if (!pm) {
  try {
    pm = require('pm-notify');
  } catch(e) {
    console.log(e.message);
  }
}

/**
 * Connection will be created from connect of device.
 * -reacts on open of device, calls onConnecting function if exists and emits 'connecting' and 'connect'
 * -reacts on closing of device and calls close on device
 * -reacts on close of device and cleans up
 * In extended constuctor create the framehandler(s) and subscribe to receive on the last framehandler.
 * 
 * @param {Device} device The device object.
 */
function Connection(device) {
  var self = this;

  // call super class
  EventEmitter2.call(this, {
    wildcard: true,
    delimiter: ':',
    maxListeners: 1000 // default would be 10!
  });

  if (this.log) {
    this.log = _.wrap(this.log, function(func, msg) {
      func(self.constructor.name + ': ' + msg);
    });
  } else if (Connection.prototype.log) {
    Connection.prototype.log = _.wrap(Connection.prototype.log, function(func, msg) {
      func(self.constructor.name + ': ' + msg);
    });
    this.log = Connection.prototype.log;
  } else {
    var debug = require('debug')(this.constructor.name);
    this.log = function(msg) {
      debug(msg);
    };
  }

  this.taskQueue = [];

  this.commandQueue = [];

  this.isTaskRunning = false;

  this.id = uuid();

  this.device = device;

  this.attributes = { id: this.id, device: this.device };

  this.set('state', 'disconnect');

  this.device.on('open', this.openHandle = function(callback) {
    if (self.log) self.log('connecting connection with id ' + self.id);

    if (pm) {
      pm.on('wake', self.wakeHandler = function() {
        if (self.log) self.log('waking up');
        if (self.onWakeUp) {
          self.onWakeUp();
        }
      });
      pm.on('sleep', self.sleepHandler = function() {
        if (self.log) self.log('going to sleep');
        if (self.onSleep) {
          self.onSleep();
        }
      });
    }

    self.set('state', 'connecting');
    self.device.emit('connecting', self.device);
    self.emit('connecting', self);
    if (self.onConnecting) {
      self.onConnecting(function(err) {
        if (err) {
          if (self.log) self.log('could not connect connection with id ' + self.id);
          self.close(function() {
            if (callback) callback(err, self);
          });
        } else {
          if (self.log) self.log('connect connection with id ' + self.id);
          self.device.emit('connect', self.device);
          self.set('state', 'connect');
          self.emit('connect', self);
          if (callback) callback(null, self);
        }
      });
    } else {
      if (self.log) self.log('connect connection with id ' + self.id);
      self.device.emit('connect', self.device);
      self.set('state', 'connect');
      self.emit('connect', self);
      if (callback) callback(null, self);
    }
  });

  this.device.on('closing', this.closingHandle = function(callback) {
    self.close(callback);
  });

  this.device.on('close', this.closeHandle = function(callback) {
    if (self.log) self.log('disconnect connection with id ' + self.id);
    self.device.emit('disconnect', self.device);
    self.set('state', 'disconnect');
    self.emit('disconnect', self);
    self.removeAllListeners();
    self.removeAllListeners('connect');
    self.removeAllListeners('connecting');
    self.removeAllListeners('disconnect');
    self.removeAllListeners('disconnecting');
    self.device.removeListener('open', self.openHandle);
    self.device.removeListener('closing', self.closingHandle);
    self.device.removeListener('close', self.closeHandle);
    if (self.device && self.device.connection) {
      delete self.device.connection;
      delete self.device;
    }
    // if (callback) callback(null, self);

    if (pm) {
      if (self.wakeHandler) pm.removeListener('wake', self.wakeHandler);
      if (self.sleepHandler) pm.removeListener('sleep', self.sleepHandler);
    }

    if (self.taskQueue) {
      self.taskQueue = [];
    }
    if (self.commandQueue) {
      self.commandQueue = [];
    }
  });
}

util.inherits(Connection, EventEmitter2);

/**
 * Sets attributes for the connection.
 * 
 * @example:
 *     connection.set('firmwareVersion', '0.0.1');
 *     // or
 *     connection.set({
 *          firmwareVersion: '0.0.1',
 *          bootloaderVersion: '0.0.1'
 *     });
 */
Connection.prototype.set = function(data) {
  if (arguments.length === 2) {
    this.attributes[arguments[0]] = arguments[1];
  } else {
    for(var m in data) {
      this.attributes[m] = data[m];
    }
  }
};

/**
 * Gets an attribute of the connection.
 * @param  {string} attr The attribute name.
 * @return {object}      The result value.
 *
 * @example:
 *     connection.get('firmwareVersion'); // returns '0.0.1'
 */
Connection.prototype.get = function(attr) {
  return this.attributes[attr];
};

/**
 * Returns `true` if the attribute contains a value that is not null
 * or undefined.
 * @param  {string} attr The attribute name.
 * @return {boolean}     The result value.
 *
 * @example:
 *     connection.has('firmwareVersion'); // returns true or false
 */
Connection.prototype.has = function(attr) {
  return (this.get(attr) !== null && this.get(attr) !== undefined);
};

/**
 * The close mechanism.
 * On closing 'disconnecting' will be emitted.
 * onDisconnecting function will be called if it exists, 
 * @param  {Function} callback The function, that will be called when connection is closed. [optional]
 *                             `function(err){}`
 */
Connection.prototype.close = function(callback) {
  if (this.get('state') !== 'connect' && this.get('state') !== 'connecting') {
    if (callback) callback(new Error('Connection is already "' + this.get('state') + '"!'));
    return;
  }
  var self = this;
  if (this.log) this.log('disconnecting connection with id ' + self.id);
  this.device.emit('disconnecting', this.device);
  this.set('state', 'disconnecting');
  this.emit('disconnecting', this);
  if (this.onDisconnecting) {
    this.onDisconnecting(function() {
      self.device.close(callback, true);
    });
  } else {
    this.device.close(callback, true);
  }
};

/**
 * Called when system is waking up from sleeping.
 */
Connection.prototype.onWakeUp = function() {
  var self = this;
  if (this.commandQueue && this.commandQueue.length > 0) {
    var cmd = this.commandQueue[0];
    if (this.isSleeping) {
      this.isSleeping = false;
      if (this.log) this.log('restart sending commands');
      self.sendCommand(cmd.command, cmd.callback);
    } else {
      setTimeout(function() {
        if (self.commandQueue && self.commandQueue.length > 0 && self.commandQueue[0] === cmd) {
          if (self.log) self.log('resend last command');
          self.sendCommand(cmd.command, cmd.callback);
        }
      }, 1000);
    }
  }
};

/**
 * Called when system is going to sleep.
 */
Connection.prototype.onSleep = function() {
  this.isSleeping = true;
};

/**
 * Dequeue command
 * @param  {Command} cmd The command that should be dequeued.
 */
Connection.prototype.dequeueCommand = function(cmd) {
  this.commandQueue = _.reject(this.commandQueue, function(c) {
    return c.command === cmd;
  });
};

/**
 * Dequeue task
 * @param  {Task} cmd The task that should be dequeued.
 */
Connection.prototype.dequeueTask = function(task) {
  this.taskQueue = _.reject(this.taskQueue, function(t) {
    return t.task === task;
  });
};

/**
 * Executes the passing command.
 * If the initialize function is present it will validate the arguments of the command.
 * If necessary for validation reason the initialize function can throw errors.
 * @param  {Command}  command  The object that represents the command. Should have a named constructor.
 * @param  {Function} callback The function, that should be called when the command's answer is received.
 *                             `function(err){}`
 */
Connection.prototype.executeCommand = function(command, callback) {
  try {
    var self = this;

    function run() {
      self.commandQueue.push({ command: command, callback: function() {
        try {
          callback.apply(callback, _.toArray(arguments));
        } catch(e) {
          var addon = '';
          if (e.message) {
            addon = ' > ' + e.message;
          }
          if (self.log) self.log(e.name + ' while calling callback of command: ' + command.constructor.name + '!' + addon);
          self.dequeueCommand(command);
          console.log(e.stack);
          throw e;
        }
      }});

      if (self.log) { self.log('>> COMMAND: ' + command.constructor.name); }

      if (!self.isSleeping) {
        process.nextTick(function() {
          try {
            self.sendCommand(command, callback);
          } catch (err) {
            var addon = '';
            if (err.message) {
              addon = ' > ' + err.message;
            }
            if (self.log) self.log(err.name + ' while sending command: ' + command.constructor.name + '!' + addon);
            self.dequeueCommand(command);
            console.log(err.stack);
            throw err;
          }
        });
      }
    }

    if (command.initialize) {
      try {
        command._initialize(this);
      } catch (err) {
        if (this.log) this.log(err.name + ' while initializing command: ' + command.constructor.name + '!');
        if (callback) { callback(err); }
        return;
      }
    }
    run();

  } catch (err) {
    var addon = '';
    if (err.message) {
      addon = ' > ' + err.message;
    }
    if (this.log) this.log(err.name + ' while executing command: ' + command.constructor.name + '!' + addon);
    this.dequeueCommand(command);
    console.log(err.stack);
    throw err;
  }
};

/**
 * Sends the passing command.
 * Define your own command handling mechanism in extended connection!
 * @param  {Command}  command  The object that represents the command. Should have a named constructor.
 * @param  {Function} callback The function, that should be called when the command's answer is received.
 *                             `function(err){}`
 */
Connection.prototype.sendCommand = function(command, callback) {
  var err = new Error('Implement the sendCommand function!');
  console.log(err.stack);
  throw err;
  // this.frameHandler.send(command.data);
};

/**
 * Checks if there is a task in the queue and runs it.
 * @return {Boolean} The check result.
 */
Connection.prototype.executeNextTask = function() {

  if (this.taskQueue.length > 0) {
    var task = this.taskQueue.splice(0, 1)[0];
    this.runTask(task.task, task.callback);
    return true;
  }
  return false;

};

/**
 * Checks if there is something to execute and executes it.
 */
Connection.prototype.checkForNextExecution = function() {
  var commandsFinished = true;
  if (this.commandQueue && _.isArray(this.commandQueue)) {
    commandsFinished = this.commandQueue.length === 0;
  }
  if (!this.isTaskRunning && commandsFinished) {
    this.executeNextTask();
  }
};

/**
 * Runs the passing task.
 * @param  {Object}   task     The object that represents the task. Should have a named constructor and the function perform.
 * @param  {Function} callback The function, that will be called when the task has started.
 *                             `function(err){}`
 */
Connection.prototype.runTask = function(task, callback) {

  if (this.log) { this.log('>> TASK ' + task.constructor.name); }

  this.isTaskRunning = true;

  var self = this;

  (function(currentTask, clb) {
    currentTask.perform(self, function() {
      if (self.log) { self.log('<< TASK ' + currentTask.constructor.name); }

      self.isTaskRunning = false;

      clb.apply(currentTask, _.toArray(arguments));
    });
  })(task, callback);

};

/**
 * Executes the passing task.
 * If the initialize function is present it will validate the arguments of the task.
 * If necessary for validation reason the initialize function can throw errors.
 * @param  {Task}     task        The object that represents the task. Should have a named constructor and the function perform.
 * @param  {Boolean}  ignoreQueue If set to true it will not put it in the queue but it will be immediately executed.
 * @param  {Function} callback    The function, that will be called when the task has started.
 *                               `function(err){}`
 */
Connection.prototype.executeTask = function(task, ignoreQueue, callback) {

  if (!callback) {
    callback = ignoreQueue;
    ignoreQueue = false;
  }

  try {
    var self = this;

    function run() {
      if (ignoreQueue) {
        self.runTask(task, callback);
      } else {
        self.taskQueue.push({ task: task, callback: function() {
          try {
            callback.apply(callback, _.toArray(arguments));
          } catch(e) {
            var addon = '';
            if (e.message) {
              addon = ' > ' + e.message;
            }
            if (self.log) self.log(e.name + ' while calling callback of task: ' + task.constructor.name + '!' + addon);
            console.log(e.stack);
            throw e;
          }
        }});

        if (!self.isTaskRunning) {
          self.checkForNextExecution();
        }
      }
    }

    if (task.initialize) {
      try {
        task._initialize(this);
      } catch (err) {
        if (this.log) this.log(err.name + ' while initializing task: ' + task.constructor.name + '!');
        if (callback) { callback(err); }
        return;
      }
    }
    run();

  } catch (err) {
    var addon = '';
    if (err.message) {
      addon = ' > ' + err.message;
    }
    if (this.log) this.log(err.name + ' while executing task: ' + task.constructor.name + '!' + addon);
    this.dequeueTask(task);
    console.log(err.stack);
    throw err;
  }

};

/* The toJSON function will be called when JSON.stringify(). */
Connection.prototype.toJSON = function() {
  var parse = JSON.deserialize || JSON.parse;
  var json = parse(JSON.stringify(this.attributes));
  json.device = this.device ? this.device.toJSON() : undefined;
  return json;
};

Connection.prototype.copy = function(device) {
  var clone = new Connection(device || this.device);
  clone.set(this.attributes);
  clone.set('id', clone.id);
  return clone;
};

module.exports = Connection;