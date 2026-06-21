// Lightweight debounce utility (replaces lodash import to shrink bundle size).
// Supports the only API surface used in this project:
//   debounce(fn, wait) -> debounced  (with .cancel())
export function debounce(func, wait = 0) {
  let timer = null;
  let lastArgs = null;
  let lastThis = null;

  function debounced(...args) {
    lastArgs = args;
    lastThis = this;
    if (timer !== null) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      timer = null;
      const argsToApply = lastArgs;
      const thisToApply = lastThis;
      lastArgs = null;
      lastThis = null;
      try {
        func.apply(thisToApply, argsToApply);
      } catch (error) {
        // Mirror lodash behavior: do not swallow here either, but avoid
        // leaving the timer in a half-state. Re-throw asynchronously.
        throw error;
      }
    }, wait);
  }

  debounced.cancel = function () {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
      lastArgs = null;
      lastThis = null;
    }
  };

  debounced.flush = function () {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
      const argsToApply = lastArgs;
      const thisToApply = lastThis;
      lastArgs = null;
      lastThis = null;
      if (argsToApply) {
        func.apply(thisToApply, argsToApply);
      }
    }
  };

  return debounced;
}

export default debounce;
