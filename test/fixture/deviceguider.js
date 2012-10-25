var DeviceGuider = require('../../index').DeviceGuider
  , util = require('util');

function MyDeviceGuider() {

    // call super class
    DeviceGuider.call(this, require('./deviceloader').create());
}

util.inherits(MyDeviceGuider, DeviceGuider);

module.exports = new MyDeviceGuider();