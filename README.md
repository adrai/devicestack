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

	MyConnection.prototype.executeCommand = function(commandData, callback) {
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

Copyright (c) 2012 Adriano Raiano

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