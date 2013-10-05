// Grab the util module that's bundled with Node
var util = require('util');

// Create a new custom Error constructor
function ValidationError(msg) {
  // Pass the constructor to V8's
  // captureStackTrace to clean up the output
  Error.captureStackTrace(this, ValidationError);

  // If defined, store a custom error message
  if (msg) {
    this.message = msg;
  }
}

// Extend our custom Error from Error
util.inherits(ValidationError, Error);

// Give our custom error a name property. Helpful for logging the error later.
ValidationError.prototype.name = ValidationError.name;

module.exports = ValidationError;