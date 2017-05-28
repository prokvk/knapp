(function() {
  var formatInputErrors, validate;

  validate = require('jsonschema').validate;

  formatInputErrors = function(errors) {
    return errors.map(function(error) {
      return error.stack;
    }).join(', ');
  };

  module.exports = {
    validateInput: function(jsonData, validationSchema) {
      var errors;
      errors = validate(jsonData, validationSchema).errors;
      if (errors.length === 0) {
        return null;
      }
      return {
        message: 'Invalid input parameters: ' + formatInputErrors(errors)
      };
    }
  };

}).call(this);
