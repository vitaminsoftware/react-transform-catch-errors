export default function catchErrors({ filename, components, imports }) {
  return function wrapToCatchErrors(ReactClass, componentId) {
    const originalRender = ReactClass.prototype.render;

    Object.defineProperty(ReactClass.prototype, 'render', {
      configurable: true,
      value: function tryRender() {
        try {
          return originalRender.apply(this, arguments);
        } catch (err) {
          setTimeout(() => {
            if (!__SERVER__) {
              if (window && window.Raven) {
                window.Raven.captureException(err);
              }
            }
            // throw err;
          });

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
