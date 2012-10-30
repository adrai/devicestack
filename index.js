var index;

if (typeof module.exports !== 'undefined') {
    index = module.exports;
} else {
    index = root.index = {};
}

index.VERSION = require('./package.json').version;

require('./util/index');

index.Device = require('./lib/device');
index.SerialDevice = require('./lib/serialdevice');
index.Connection = require('./lib/connection');
index.FrameHandler = require('./lib/framehandler');
index.DeviceLoader = require('./lib/deviceloader');
index.SerialDeviceLoader = require('./lib/serialdeviceloader');
index.DeviceGuider = require('./lib/deviceguider');
index.SerialDeviceGuider = require('./lib/serialdeviceguider');