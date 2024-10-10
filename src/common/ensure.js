/**
 * ensure a condition is met
 * @param {() => boolean} condition
 * @param {number} maxAttempts
 * @param {string} failureMessage
 * @returns {Promise<boolean>}
 */
function ensureCondition(condition, maxAttempts = 600, failureMessage) {
  return new Promise((resolve, reject) => {
    let attempts = 0;

    function detect() {
      const result = condition();
      if (result) {
        resolve(result);
      } else if (attempts < maxAttempts) {
        attempts++;
        requestAnimationFrame(detect);
      } else {
        reject(new Error(failureMessage));
      }
    }

    requestAnimationFrame(detect);
  });
}

/**
 * ensure a global object is present
 * @param {string} objectName
 * @param {number} maxAttempts
 * @returns {Promise<boolean>}
 */
export function ensureGlobalObject(objectName, maxAttempts = 600) {
  return ensureCondition(
    () => window[objectName],
    maxAttempts,
    `Cannot detect ${objectName} after ${maxAttempts} attempts`
  );
}

/**
 * ensure an element is present
 * @param {string} selector
 * @param {number} maxAttempts
 * @returns {Promise<boolean>}
 */
export function ensureElement(selector, maxAttempts = 600) {
  return ensureCondition(
    () => document.querySelector(selector),
    maxAttempts,
    `Cannot detect ${selector} after ${maxAttempts} attempts`
  );
}

/**
 * ensure a key is present in an object
 * @param {object} object
 * @param {string} key
 * @param {number} maxAttempts
 * @returns {Promise<boolean>}
 */
export function ensureKey(object, key, maxAttempts = 6000) {
  return ensureCondition(
    () => object[key],
    maxAttempts,
    `Cannot detect ${key} after ${maxAttempts} attempts`
  );
}
