var EventEmitter2 = require('eventemitter2').EventEmitter2,
    util = require('util'),
    _ = require('lodash'),
    uuid = require('node-uuid').v4;

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
  }

  this.taskQueue = [];

  this.commandQueue = [];

  this.isTaskRunning = false;

  this.id = uuid();
  
  this.device = device;

  this.attributes = { id: this.id, device: this.device };

  this.device.on('open', this.openHandle = function(callback) {
    if (self.log) self.log('connecting connection with id ' + self.id);
    self.emit('connecting', self);
    if (self.onConnecting) {
      self.onConnecting(function() {
        if (self.log) self.log('connect connection with id ' + self.id);
        self.emit('connect', self);
        if (callback) callback(null, self);
      });
    } else {
      if (self.log) self.log('connect connection with id ' + self.id);
      self.emit('connect', self);
      if (callback) callback(null, self);
  }
  });

  this.device.on('closing', this.closingHandle = function(callback) {
    self.close(callback);
  });

  this.device.on('close', this.closeHandle = function(callback) {
    if (self.log) self.log('disconnect connection with id ' + self.id);
    self.emit('disconnect', self);
    self.removeAllListeners();
    self.removeAllListeners('connect');
    self.removeAllListeners('connecting');
    self.removeAllListeners('disconnect');
    self.removeAllListeners('disconnecting');
    self.device.removeListener('open', self.openHandle);
    self.device.removeListener('closing', self.closingHandle);
    // if (callback) callback(null, self);
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
 * @return {object}      [description]
 *
 * @example:
 *     connection.get('firmwareVersion'); // returns '0.0.1'
 */
Connection.prototype.get = function(attr) {
  return this.attributes[attr];
};

/**
 * The close mechanism.
 * On closing 'disconnecting' will be emitted.
 * onDisconnecting function will be called if it exists, 
 * @param  {Function} callback The function, that will be called when connection is closed. [optional]
 *                             `function(err){}`
 */
Connection.prototype.close = function(callback) {
  var self = this;
  if (this.log) this.log('disconnecting connection with id ' + self.id);
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
 * Executes the passing command.
 * Define your own command handling mechanism in extended connection!
 * @param  {Command}  command  The object that represents the command. Should have a named constructor.
 * @param  {Function} callback The function, that should be called when the command's answer is received.
 *                             `function(err){}`
 */
Connection.prototype.executeCommand = function(command, callback) {
  throw new Error('Implement the executeCommand function!');
  // if (this.log) { this.log('>> COMMAND: ' + command.constructor.name); }
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

  if (ignoreQueue) {
    this.runTask(task, callback);
  } else {
    this.taskQueue.push({ task: task, callback: callback });

    if (!this.isTaskRunning) {
      this.checkForNextExecution();
    }
  }
    
};

/* The toJSON function will be called when JSON.stringify(). */
Connection.prototype.toJSON = function() {
  var parse = JSON.deserialize || JSON.parse;
  var json = parse(JSON.stringify(this.attributes));
  json.device = this.device ? this.device.toJSON() : undefined;
  return json;
};

module.exports = Connection;