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

	var Device = require('../../index').Device
	  , util = require('util')
	  , _ = require('lodash');

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