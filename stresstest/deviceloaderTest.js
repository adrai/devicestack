var deviceloader = require('../test/fixture/deviceloader');

var counterPlug = 0,
    counterUnplug = 0;

deviceloader.on('unplug', function(connection) {
	counterUnplug++;
	console.log('unplugged ' + counterUnplug + ' times!');

	deviceloader.startDevices = [ new deviceloader.Device() ];
});
deviceloader.on('plug', function(connection) {
	counterPlug++;
	console.log('plugged ' + counterPlug + ' times!');

	deviceloader.startDevices = [];
});

deviceloader.startDevices = [ new deviceloader.Device() ];
deviceloader.startLookup();