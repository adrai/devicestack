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

try {
  index.SerialDevice = require('./lib/serialdevice');
  index.SerialDeviceLoader = require('./lib/serialdeviceloader');
  index.SerialDeviceGuider = require('./lib/serialdeviceguider');
} catch(e) { }