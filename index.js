var index;

if (typeof module.exports !== 'undefined') {
  index = module.exports;
} else {
  index = root.index = {};
}

index.VERSION = require('./package.json').version;

require('./util/index');

index.Device = require('./lib/device');
index.Connection = require('./lib/connection');
index.FrameHandler = require('./lib/framehandler');
index.DeviceLoader = require('./lib/deviceloader');
index.DeviceGuider = require('./lib/deviceguider');
index.Command = require('./lib/command');
index.Task = require('./lib/task');

try {
  index.SerialDevice = require('./lib/serial/device');
  index.SerialDeviceLoader = require('./lib/serial/deviceloader');
  index.SerialDeviceGuider = require('./lib/serial/deviceguider');
} catch(e) { }

try {
  index.FtdiDevice = require('./lib/ftdi/device');
  index.FtdiDeviceLoader = require('./lib/ftdi/deviceloader');
} catch(e) { }

try {
  index.FtdiSerialDevice = require('./lib/ftdiserial/device');
} catch(e) { }

// try {
  index.UsbDeviceLoader = require('./lib/usb/deviceloader');
// } catch(e) { }