export default function catchErrors({ filename, components, imports }) {
  const [React, ErrorReporter, reporterOptions] = imports;

  if (!React || !React.Component) {
    throw new Error('imports[0] for react-transform-catch-errors does not look like React.');
  }

  return function wrapToCatchErrors(ReactClass, componentId) {
    const originalRender = ReactClass.prototype.render;

    Object.defineProperty(ReactClass.prototype, 'render', {
      configurable: true,
      value: function tryRender() {
        try {
          return originalRender.apply(this, arguments);
        } catch (err) {
          setTimeout(() => {
            if (ErrorReporter) {
              if (typeof console.reportErrorsAsExceptions !== 'undefined') {
                let prevReportErrorAsExceptions = console.reportErrorsAsExceptions;
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
            return React.createElement(ErrorReporter, {
              error: err,
              filename,
              ...reporterOptions
            });
          }

          return (
            <span
              style={{
                background: 'red',
                color: 'white'
              }}
            >
              Render error!
            </span>
          );
        }
      }
    });

    return ReactClass;
  };
}
