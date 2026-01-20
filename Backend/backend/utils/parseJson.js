export function parseJsonField(value, defaultValue = {}) {
  if (value === undefined || value === null) return defaultValue;

  // Already an object (non form-data request)
  if (typeof value === 'object') return value;

  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch (err) {
      return defaultValue;
    }
  }

  return defaultValue;
}
