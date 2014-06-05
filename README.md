<pre>
  eeeee eeeee eeeee eeee       e  eeeee 
  8   8 8  88 8   8 8          8  8   " 
  8e  8 8   8 8e  8 8eee       8e 8eeee 
  88  8 8   8 88  8 88      e  88    88 
  88  8 8eee8 88ee8 88ee 88 8ee88 8ee88

  eeeee eeee e   e e   eeee eeee eeeee eeeee eeeee  eeee e  ee 
  8   8 8    8   8 8  8e    8    8   "   8   8   8 8e    8 8   
  8e  8 8eee e   e 8e 8     8eee 8eeee   8e  8eee8 8     8eee 
  88  8 88    8 8  88 8e    88      88   88  88  8 8e    88 8e
  88ee8 88ee   8   88  eeee 88ee 8ee88   88  88  8  eeee 88  8
</pre>

# Introduction

[![Build Status](https://secure.travis-ci.org/adrai/devicestack.png)](http://travis-ci.org/adrai/devicestack)

This module helps you to represent a device and its protocol.

[Release notes](https://github.com/adrai/devicestack/blob/master/releasenotes.md)

<pre>
   ___________________________________________________   
  |                                   |          |    |  
  |                                   |   tasks  |    |  
  |________________    deviceguider   |__________|    |  
  |                |                  |               |  
  |  deviceloader  |                  |   commands    |  
  |________________|__________________|_______________|  
  |                |               ___________________|  
  |                |  connection  |                   |  
  |     device     |______________|  framehandler(s)  |  
  |                               |___________________|  
  |                                                   |  
  |___________________________________________________|  

</pre>

Each of the following software components can be used separately if you want...
- require('devicestack').Device
- require('devicestack').SerialDevice
- require('devicestack').FtdiDevice
- require('devicestack').FtdiSerialDevice
- require('devicestack').Connection
- require('devicestack').FrameHandler
- require('devicestack').DeviceLoader
- require('devicestack').SerialDeviceLoader
- require('devicestack').EventedSerialDeviceLoader
- require('devicestack').FtdiDeviceLoader
- require('devicestack').EventedFtdiDeviceLoader
- require('devicestack').DeviceGuider
- require('devicestack').SerialDeviceGuider
- require('devicestack').Command
- require('devicestack').Task

## Prototype hierarchy

	Device -> SerialDevice -> FtdiSerialDevice
	Device -> FtdiDevice -> FtdiSerialDevice
	DeviceLoader -> SerialDeviceLoader -> EventedSerialDeviceLoader
	DeviceLoader -> FtdiDeviceLoader -> EventedFtdiDeviceLoader
	DeviceGuider -> SerialDeviceGuider

## device
Device represents your physical device.

### open
Implement the open mechanism to your device.
Call with optional callback. On opened emit 'open' and call the callback.

- If extending from `require('devicestack').SerialDevice` this mechanism is already defined!
- If extending from `require('devicestack').FtdiDevice` this mechanism is already defined!
- If extending from `require('devicestack').FtdiSerialDevice` this mechanism is already defined!

### close
Implement the close mechanism to your device.
Call with optional callback. On closed emit 'close' and call the callback.

- If extending from `require('devicestack').SerialDevice` this mechanism is already defined!
- If extending from `require('devicestack').FtdiDevice` this mechanism is already defined!
- If extending from `require('devicestack').FtdiSerialDevice` this mechanism is already defined!

### send
Implement the send mechanism to your device by subscribing the 'send' event.
Call send or emit 'send' on the device with a byte array.

- If extending from `require('devicestack').Device` the send function is already defined!

### receive
Implement the receive mechanism from your device by emitting the 'receive' event.
When you receive data from your device emit 'receive' with a byte array.

- If extending from `require('devicestack').SerialDevice` this mechanism is already defined!
- If extending from `require('devicestack').FtdiDevice` this mechanism is already defined!
- If extending from `require('devicestack').FtdiSerialDevice` this mechanism is already defined!

### connect
Implement the connect mechanism to your device.
Call with optional callback. On connecting emit 'opening', create a new connection instance and call open by passing the callback.

- If extending from `require('devicestack').Device` this mechanism is already defined!

### disconnect
Implement the disconnect mechanism to your device.
Call with optional callback. On disconnecting emit 'closing' and call close by passing the callback.

- If extending from `require('devicestack').Device` this mechanism is already defined!

### set
Sets attributes for the device.

- If extending from `require('devicestack').Device` this mechanism is already defined!

example:

	device.set('firmwareVersion', '0.0.1');
	// or
	device.set({
		firmwareVersion: '0.0.1',
		bootloaderVersion: '0.0.1'
	});

### get
Gets an attribute of the device.

- If extending from `require('devicestack').Device` this mechanism is already defined!

example:

	device.get('firmwareVersion'); // returns '0.0.1'

### has
Returns `true` if the attribute contains a value that is not null or undefined.

- If extending from `require('devicestack').Device` this mechanism is already defined!

example:

	device.has('firmwareVersion'); // returns true or false


## connection
Connection will be created from connect of device.

- reacts on open of device, calls `onConnecting` function if exists and emits 'connecting' and 'connect' and emits 'connecting' on device
- reacts on closing of device and calls close on device
- reacts on close of device and cleans up

In extended constuctor create the framehandler(s) and subscribe to receive on the last framehandler.

### close
Implement the close mechanism.
Call with optional callback. On closing emit 'disconnecting', call `onDisconnecting` function if exists, on disconnected emit 'disconnect' and call close on device by passing the callback. Emits 'disconnecting' on device.

- If extending from `require('devicestack').Connection` this mechanism is already defined!

### onConnecting
Define `onConnecting` function if you need to send some commands before definitely connected?

### onDisconnecting
Define `onDisconnecting` function if you need to send some commands before definitely disconnected?

### set
Sets attributes for the connection.

- If extending from `require('devicestack').Connection` this mechanism is already defined!

example:

	connection.set('firmwareVersion', '0.0.1');
	// or
	connection.set({
		firmwareVersion: '0.0.1',
		bootloaderVersion: '0.0.1'
	});

### get
Gets an attribute of the connection.

- If extending from `require('devicestack').Connection` this mechanism is already defined!

example:

	connection.get('firmwareVersion'); // returns '0.0.1'

### has
Returns `true` if the attribute contains a value that is not null or undefined.

- If extending from `require('devicestack').Connection` this mechanism is already defined!

example:

	connection.has('firmwareVersion'); // returns true or false

### executeCommand
Executes the passing command.
If the initialize function is present it will validate the arguments of the command.
If necessary for validation reason the initialize function can throw errors.
Pushes the command in a queue and calls the sendCommand function.

### sendCommand
Sends the passing command.
Implement the executeCommand mechanism.

### executeTask
Executes the passing task.
If the initialize function is present it will validate the arguments of the task.
If necessary for validation reason the initialize function can throw errors.

- If extending from `require('devicestack').Connection` this mechanism is already defined!

### runTask
Runs the passing task.

- If extending from `require('devicestack').Connection` this mechanism is already defined!

### runTask
Runs the passing task.

- If extending from `require('devicestack').Connection` this mechanism is already defined!

### executeNextTask
Checks if there is a task in the queue and runs it.

- If extending from `require('devicestack').Connection` this mechanism is already defined!

### checkForNextExecution
Checks if there is something to execute and executes it.
IMPORTANT!!! Call this function when a command answer is handled!

- If extending from `require('devicestack').Connection` this mechanism is already defined!


## framehandler(s)
You can have one or multiple framehandlers. A framhandler receives data from the upper layer and sends it to the lower layer by wrapping some header or footer information. A framehandler receives data from lower layer and sends it to the upper layer by unwrapping some header or footer information. The lowest layer for a framehandler is the device and the topmost ist the connection.

- reacts on send of upper layer, calls `wrapFrame` function if exists and calls `send` function on lower layer
- reacts on receive of lower layer, calls `unwrapFrame` function if exists and emits `receive`
- automatically analyzes incomming data

### analyze
Calls `analyzeNextFrame` function in a loop.

- If extending from `require('devicestack').FrameHandler` this mechanism is already defined!

### trigger
Triggers the `analyze` function.

- If extending from `require('devicestack').FrameHandler` this mechanism is already defined!

### send
Call send or emit 'send' on the device with a byte array.

- If extending from `require('devicestack').FrameHandler` this mechanism is already defined!

### analyzeNextFrame
Implement the analyzeNextFrame mechanism that returns a frame as byte array or null of no frame found.
Call with current incomming buffer.

### wrapFrame
Define `wrapFrame` function if you need to wrap frames?

### unwrapFrame
Define `unwrapFrame` function if you need to unwrap frames?


## deviceloader
A deviceloader can check if there are available some devices.

### startLookup
Creates an interval that calls `trigger` function.
Call with optional interval in milliseconds and optional callback.

- If extending from `require('devicestack').DeviceLoader` this mechanism is already defined!

### stopLookup
Stops the interval that calls `trigger` function.

- If extending from `require('devicestack').DeviceLoader` this mechanism is already defined!

### trigger
Calls `lookup` function with optional callback and emits 'plug' for new attached devices and 'unplug' for removed devices.

- If extending from `require('devicestack').DeviceLoader` this mechanism is already defined!

### lookup
Call with optional callback and call callback with an array of devices.

- If extending from `require('devicestack').SerialDeviceLoader` this mechanism is already defined!
- If extending from `require('devicestack').FtdiDeviceLoader` this mechanism is already defined!


## deviceguider
A deviceguider emits 'plug' for new attached devices, 'unplug' for removed devices, emits 'connect' for connected devices and emits 'disconnect' for disconnected devices.
- Emits 'connecting' and 'disconnecting' with device object.
- Emits 'connectionStateChanged' with state and connection or device.

### getCurrentState
Call with callback and it calls the callback with the current state, containing the connectionMode, the list of plugged devices and the list of connected devices.

- If extending from `require('devicestack').DeviceGuider` this mechanism is already defined!

### autoconnect
Call with optional connectDirectly flag it emits 'connectionModeChanged'. When plugging a device it will now automatically connect it and emit 'connect'. Dependent on the connectDirectly flag already plugged devices will connect immediately.

- If extending from `require('devicestack').DeviceGuider` this mechanism is already defined!

### autoconnectOne
Call with optional connectDirectly flag and callback it emits 'connectionModeChanged'. When plugging one device it will now automatically connect one and emit 'connect'. Dependent on the connectDirectly flag if there is already a plugged device, it will connect immediately and call the callback.

- If extending from `require('devicestack').DeviceGuider` this mechanism is already defined!

### manualconnect
Call with optional disconnectDirectly flag and optional callback it emits 'connectionModeChanged'. When plugging a device it will not connect it. Dependent on the disconnectDirectly flag already connected devices will disconnect immediately and call the callback.

- If extending from `require('devicestack').DeviceGuider` this mechanism is already defined!

### setConnectionMode
Call with optional options and optional callback it emits 'connectionModeChanged'.

- If extending from `require('devicestack').DeviceGuider` this mechanism is already defined!

### connect (alias connectDevice)
Call with the deviceId or the device and optional callback it will connect that device and call the callback.

- If extending from `require('devicestack').DeviceGuider` this mechanism is already defined!

### disconnect (alias disconnectDevice)
Call with the deviceId or the device and optional callback it will disconnect that device and call the callback.

- If extending from `require('devicestack').DeviceGuider` this mechanism is already defined!

### closeConnection
Call with the connectionId or the connection and optional callback it will close that connection and call the callback.

- If extending from `require('devicestack').DeviceGuider` this mechanism is already defined!

### checkConnectionMode
Call with a connectionMode value it checks if the connectionMode will change and returns true or false.

- If extending from `require('devicestack').DeviceGuider` this mechanism is already defined!

### changeConnectionMode
Call with a connectionMode value it checks if the connectionMode will change and emits 'connectionModeChanged'.

- If extending from `require('devicestack').DeviceGuider` this mechanism is already defined!

### connect
Call with the portname and optional callback it will connect that device and call the callback.

- If extending from `require('devicestack').SerialDeviceGuider` this mechanism is already defined!

### disconnect
Call with the portname and optional callback it will disconnect that device and call the callback.

- If extending from `require('devicestack').SerialDeviceGuider` this mechanism is already defined!


## commands
Build your own commands looking like this:

	var Command = require('../../index').Command,
	    util = require('util');

	function MyCommand(firstByte) {
	  // call super class
	  Command.call(this, arguments);
	}

	util.inherits(MyCommand, Command);

	// if argumentsSchema is defined it will validates the passed constructor arguments
	MyCommand.prototype.argumentsSchema = {
	  type: 'array',
	  items: [
	    {
	      anyOf: [
	        {
	          type: 'number'
	        },
	        {
	          type: 'undefined'
	        }
	      ]
	    },
	    {
	      type: 'string'
	    }
	  ]
	};

	MyCommand.prototype.initialize = function(connection, firstByte) {

	  firstByte = firstByte || 0x01;

	  if (firstByte < 0) {
	    throw new Error('wrong value');
	  }

	  this.data = [firstByte, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09];
	};

	MyCommand.prototype.execute = function(connection, callback) {
	  connection.executeCommand(this, callback);
	};

	module.exports = MyCommand;

###BE SURE TO DEFINE JSON SCHEMAS!
Hint: [http://jsonary.com/documentation/json-schema/](http://jsonary.com/documentation/json-schema/)


## tasks
Build your own tasks looking like this:

	var Task = require('../../index').Task,
	    util = require('util'),
	    Command = require('./command');

	function MyTask(identifier) {
	  // call super class
	  Task.call(this, arguments);
	}

	util.inherits(MyTask, Task);

	// if argumentsSchema is defined it will validates the passed constructor arguments
	MyTask.prototype.argumentsSchema = {
	  type: 'array',
	  minItems: 0,
	  items: [
	    {
	    },
	    {
	      type: 'string'
	    }
	  ]
	};

	MyTask.prototype.initialize = function(connection, identifier) {
	  if (identifier === 111) {
	    throw new Error('wrong value in task');
	  }

	  this.command = new Command(identifier);
	};

	MyTask.prototype.perform = function(connection, callback) {
	  this.execute(this.command, connection, callback);
	};

	module.exports = MyTask;

###BE SURE TO DEFINE JSON SCHEMAS!
Hint: [http://jsonary.com/documentation/json-schema/](http://jsonary.com/documentation/json-schema/)


## utils
Some utility functions are shipped with this module.

### array | toBuffer
Converts a byte array to a buffer object.
	[0x01, 0x00].toBuffer()

### array | toHexDebug
Converts a byte array to a readable hex string.
	[0x01, 0x00].toHexDebug() // returns '01-00'

### array | toHexString
Converts a byte array to a hex string.
	[0x01, 0x00].toHexString() // returns '0100'

### buffer | toArray
Converts a buffer object to a byte array.
	(new Buffer([0x01, 0x00])).toArray() // returns [0x01, 0x00]

### buffer | toHexDebug
Converts a buffer object to a readable hex string.
	(new Buffer([0x01, 0x00])).toHexDebug() // returns '01-00'

### string | toArray
Converts a hex string to a byte array.
	'0100'.toArray()  // returns [0x01, 0x00]
	'01-FA'.toArray() // returns [0x01, 0xFA]

### array | isByteArray
Checks if the passed argument is an array that contains byte values.
	Array.isByteArray([0x01, 0x00]) // returns true

# Installation

    npm install devicestack


# Usage

## Start from the device

	var Device = require('devicestack').Device
	  , util = require('util');

	function MyDevice() {
	    // call super class
	    Device.call(this);
	}

	util.inherits(MyDevice, Device);

	MyDevice.prototype.open = function(callback) {
	    var self = this;

	    setTimeout(function() {
	        self.emit('open', callback);
	        if (!self.connection && callback) callback();
	    }, 10);

	    this.on('send', function(data) {
	        setTimeout(function() {
	            self.emit('receive', data);
	        }, 5);
	    });
	};

	MyDevice.prototype.close = function(callback, fire) {
	    var self = this;

	    setTimeout(function() {
	        self.emit('close', callback);
	        self.removeAllListeners();
	        if (callback && (!self.connection || fire)) callback(null);
	    }, 10);
	};

	module.exports = MyDevice;

### If it's a serial device extend from SerialDevice

	var SerialDevice = require('devicestack').SerialDevice
	  , util = require('util');

	function MyDevice(port) {
	    // call super class
	    SerialDevice.call(this,
	        port, 
	        {
	            baudrate: 38400,
	            databits: 8,
	            stopbits: 1,
	            parity: 'none'
	        }
	    );
	}

	util.inherits(MyDevice, SerialDevice);

	module.exports = MyDevice;


### If it's a ftdi device...

    var FtdiDevice = require('devicestack').FtdiDevice
      , util = require('util');

    function MyDevice(ftdiSettings) {
        // call super class
        FtdiDevice.call(this,
            ftdiSettings,
            {
                baudrate: 38400,
                databits: 8,
                stopbits: 1,
                parity: 'none'
            }
        );
    }

    util.inherits(MyDevice, SerialDevice);

    module.exports = MyDevice;

### ...and use it this way...
    var MyDevice = require('./myDevice');

    var myDevice = new MyDevice({
      locationId: 0x1234,
      serialNumber: 's2345'
    });

    myDevice.open(function(err) {

      myDevice.on('receive', function(data) {
        console.log(data);
      });

      myDevice.send([0x01, 0x02, 0x03]);

    });


## Continue with the framehandler(s)

	var FrameHandler = require('devicestack').FrameHandler
	  , util = require('util');

	function MyFrameHandler(device) {
	    // call super class
	    FrameHandler.call(this, device);
	}

	util.inherits(MyFrameHandler, FrameHandler);

	MyFrameHandler.prototype.analyzeNextFrame = function(incomming) {
	    return incomming.splice(0);
	};

	MyFrameHandler.prototype.unwrapFrame = function(frame) {
	    return frame;
	};

	MyFrameHandler.prototype.wrapFrame = function(frame) {
	    return frame;
	};

	module.exports = MyFrameHandler;


## Now build your stack with the device and the framehandler(s) defining a connection

	var Connection = require('devicestack').Connection
	  , util = require('util')
	  , FrameHandler = require('./framehandler');

	function MyConnection(device) {
	    // call super class
	    Connection.call(this, device);

	    this.frameHandler = new FrameHandler(this.device);
	    this.frameHandler.on('receive', function (frame) {
	        // forward to appropriate command...
	    });
	}

	util.inherits(MyConnection, Connection);

	// define if needed
	MyConnection.prototype.onConnecting = function(callback) {
	    // Need to send some commands before definitely connected?
	    if (callback) callback();
	};

	// define if needed
	MyConnection.prototype.onDisconnecting = function(callback) {
	    // Need to send some commands before definitely closed?
	    if (callback) callback();
	};

	MyConnection.prototype.sendCommand = function(commandData, callback) {
	    this.frameHandler.send('send', commandData);
	};

	module.exports = MyConnection;

### Don't forget to extend the device with the connection

	var Device = require('devicestack').Device
	  , util = require('util')
	  , Connection = require('./connection'); // this line...

	function MyDevice() {
	    // call super class
	    Device.call(this, Connection);  // ...and this line
	}

	util.inherits(MyDevice, Device);

	MyDevice.prototype.open = function(callback) {
	    var self = this;

	    setTimeout(function() {
	        self.emit('open', callback);
	        if (!self.connection && callback) callback();
	    }, 10);

	    this.on('send', function(data) {
	        setTimeout(function() {
	            self.emit('receive', data);
	        }, 5);
	    });
	};

	MyDevice.prototype.close = function(callback, fire) {
	    var self = this;

	    setTimeout(function() {
	        self.emit('close', callback);
	        self.removeAllListeners();
	        if (callback && (!self.connection || fire)) callback(null);
	    }, 10);
	};

	module.exports = MyDevice;

### If it's a serial device...

	var SerialDevice = require('devicestack').SerialDevice
	  , util = require('util')
	  , Connection = require('./connection'); // this line...;

	function MyDevice(port) {
	    // call super class
	    SerialDevice.call(this,
	        port, 
	        {
	            baudrate: 38400,
	            databits: 8,
	            stopbits: 1,
	            parity: 'none'
	        },
	        Connection // ...and this line
	    );
	}

	util.inherits(MyDevice, SerialDevice);

	module.exports = MyDevice;

### If it's a ftdi device...

	var FtdiDevice = require('devicestack').FtdiDevice
	  , util = require('util')
	  , Connection = require('./connection'); // this line...;

	function MyDevice(ftdiSettings) {
	    // call super class
	    FtdiDevice.call(this,
	        ftdiSettings,
	        {
		          baudrate: 38400,
		          databits: 8,
		          stopbits: 1,
		          parity: 'none'
		      },
	        Connection // ...and this line
	    );
	}

	util.inherits(MyDevice, SerialDevice);

	module.exports = MyDevice;

### ...and use it this way...
	var MyDevice = require('./myDevice');

	var myDevice = new MyDevice({
		locationId: 0x1234,
  	serialNumber: 's2345'
	});

	myDevice.open(function(err) {

		myDevice.on('receive', function(data) {
			console.log(data);
		});

		myDevice.send([0x01, 0x02, 0x03]);

	});


## Let's lookup

	var DeviceLoader = require('devicestack').DeviceLoader
	  , util = require('util')
	  , Device = require('./device');

	function MyDeviceLoader() {
	    // call super class
	    DeviceLoader.call(this);
	}

	util.inherits(MyDeviceLoader, DeviceLoader);

	MyDeviceLoader.prototype.lookup = function(callback) {
	    var devices =  = [
	        new Device(),
	        new Device()
	    ];
	    try {
	        this.emit('lookup');
	    } catch(e) {
	    }
	    callback(null, devices);
	};

	module.exports = new MyDeviceLoader();

### If it's a serial device extend from serialdeviceloader...

	var SerialDeviceLoader = require('devicestack').SerialDeviceLoader
	  , _ = require('lodash')
	  , util = require('util')
	  , Device = require('./device');

	function MyDeviceLoader() {
	    // call super class
	    MyDeviceLoader.call(this, Device);
	}

	util.inherits(MyDeviceLoader, SerialDeviceLoader);

	MyDeviceLoader.prototype.filter = function(ports) {
	    var resPorts = _.filter(ports, function(item) {
	        if (process.platform == 'win32') {
	            return item.pnpId.indexOf('VID_1234+PID_5678') >= 0;
	        } else if (process.platform == 'darwin') {
	            return item.productId === '0x5678' && item.vendorId === '0x1234';
	        } else {
	            return item.pnpId.indexOf('MyDeviceIdentification') >= 0;
	        }
	    });
	    return resPorts;
	};

	module.exports = new MyDeviceLoader();


## And finally help with a guider

	var DeviceGuider = require('devicestack').DeviceGuider
	  , util = require('util')
	  , deviceLoader = require('./deviceloader');

	function MyDeviceGuider() {

	    // call super class
	    DeviceGuider.call(this, deviceLoader);
	}

	util.inherits(MyDeviceGuider, DeviceGuider);

	module.exports = new MyDeviceGuider();


## And now?

	var myDeviceguider = require('./deviceguider');

	myDeviceguider.on('err', function(err) {
	    if (err) { console.log(err); return process.exit(); }
	});

	myDeviceguider.on('plug', function(device) {
	    console.log('\n--->>> plugged a device\n');
	});

	myDeviceguider.on('unplug', function(device) {
	    console.log('\n--->>> unplugged a device\n');
	});

	myDeviceguider.on('connect', function(connection) {
	    console.log('\n--->>> connected a device\n');

	    connection.executeCommand(/* your stuff */, callback);
	});
	
	myDeviceguider.on('disconnect', function(connection) {
	    console.log('\n--->>> disconnected a device\n');
	});

	myDeviceguider.getCurrentState(function(err, currentState) {
	    if (currentState.plugged.length === 0) { console.log('No devices found!'); /*return process.exit();*/ }
	});

	myDeviceguider.on('connectionStateChanged', function(evt) {
	    // evt-> { state: 'connect', connection: /* connection */ }
		  // evt-> { state: 'disconnect', connection: /* connection */ }
		  // evt-> { state: 'connecting', device: /* device */ }
			// evt-> { state: 'disconnecting', device: /* device */ }
	});



	// V1: autoconnect first device...
	myDeviceguider.on('connect', function(device, connection) {
	    // when first device connected...
	});
	myDeviceguider.autoconnectOne([function(err, device, connection) {}]);
	myDeviceguider.stopautoconnecting(); // will stop autoconnecting and will disconnect connected device

	// V2: autoconnect all devices...
	myDeviceguider.on('connect', function(device, connection) {
	    // when a device connected...
	});
	myDeviceguider.autoconnect();
	myDeviceguider.stopautoconnecting(); // will stop autoconnecting and will disconnect all connected devices

	// V3: manualconnect devices...
	myDeviceguider.on('plug', function(device) {
	    // when a device ready to be connected...
	    device.connect(function(err, connection) {
	        // device connected...
	    });
	});

	// V4: manualconnect a device with port...
	myDeviceguider.on('connect', function(device, connection) {
	    // when first device connected...
	});
	myDeviceguider.connect(port[, function(err, device, connection) {}]);



# License

Copyright (c) 2014 Adriano Raiano

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.