var index;

if (typeof module.exports !== 'undefined') {
  index = module.exports;
} else {
  index = root.index = {};
}

index.version = require('./package.json').version;

require('./util/index');

index.Device = require('./lib/device');
index.Connection = require('./lib/connection');
index.FrameHandler = require('./lib/framehandler');
index.DeviceLoader = require('./lib/deviceloader');
index.DeviceGuider = require('./lib/deviceguider');
index.Command = require('./lib/command');
index.Task = require('./lib/task');

var tv4 = require('tv4');
index.addAdditionalValidationSchema = function(ref, schema) {
  tv4.addSchema(ref, schema);
};
index.addAdditionalFormatForValidationSchemas = function(ref, fn) {
  tv4.addFormat(ref, fn);
};

try {
  index.SerialDevice = require('./lib/serial/device');
  index.SerialDeviceLoader = require('./lib/serial/deviceloader');
  index.EventedSerialDeviceLoader = require('./lib/serial/eventeddeviceloader');
  index.SerialDeviceGuider = require('./lib/serial/deviceguider');
} catch(e) {
  console.log(e.message);
}

try {
  index.FtdiDevice = require('./lib/ftdi/device');
  index.FtdiDeviceLoader = require('./lib/ftdi/deviceloader');
  index.EventedFtdiDeviceLoader = require('./lib/ftdi/eventeddeviceloader');
} catch(e) {
  console.log(e.message);
}

try {
  index.FtdiSerialDevice = require('./lib/ftdiserial/device');
} catch(e) {
  console.log(e.message);
}

try {
  index.UsbDeviceLoader = require('./lib/usb/deviceloader');
} catch(e) {
  console.log(e.message);
}