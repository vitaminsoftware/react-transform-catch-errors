'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

exports.default = catchErrors;
function catchErrors(_ref) {
  var filename = _ref.filename;
  var components = _ref.components;
  var imports = _ref.imports;

  var _imports = _slicedToArray(imports, 3);

  var React = _imports[0];
  var ErrorReporter = _imports[1];
  var reporterOptions = _imports[2];


  if (!React || !React.Component) {
    throw new Error('imports[0] for react-transform-catch-errors does not look like React.');
  }

  return function wrapToCatchErrors(ReactClass, componentId) {
    var originalRender = ReactClass.prototype.render;

    Object.defineProperty(ReactClass.prototype, 'render', {
      configurable: true,
      value: function tryRender() {
        try {
          return originalRender.apply(this, arguments);
        } catch (err) {
          setTimeout(function () {
            if (ErrorReporter) {
              if (typeof console.reportErrorsAsExceptions !== 'undefined') {
                var prevReportErrorAsExceptions = console.reportErrorsAsExceptions;
                // We're in React Native. Don't throw.
                // Stop react-native from triggering its own error handler
                console.reportErrorsAsExceptions = false;
                // Log an error
                console.error(err);
                // Reactivate it so other errors are still handled
                console.reportErrorsAsExceptions = prevReportErrorAsExceptions;
              } else {
                throw err;
              }
            } else if (!__SERVER__) {
              /**
               * Right now in server-side rendering mode I don't know how to
               * send the error to sentry, the global hook doesn't work
               * In any case, the rendering will continue as in client side
               * and because of the double rendering problem the error
               * will be sent to sentry from client side
               */
              if (window && window.Raven) {
                window.Raven.captureException(err);
              }
            }
          });

          if (ErrorReporter) {
            return React.createElement(ErrorReporter, _extends({
              error: err,
              filename: filename
            }, reporterOptions));
          }

          // I don't want to render anything in production
          return null;
        }
      }
    });

    return ReactClass;
  };
}