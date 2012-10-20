var DeviceGuider = require('../../index').DeviceGuider
  , util = require('util')
  , deviceLoader = require('./deviceloader');

function MyDeviceGuider() {

    // call super class
    DeviceGuider.call(this, deviceLoader);
}

util.inherits(MyDeviceGuider, DeviceGuider);

// MyDeviceGuider.prototype.filter = function(ports) {
// };

module.exports = new MyDeviceGuider();