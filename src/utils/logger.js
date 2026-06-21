/**
 * 日志工具
 */

const LOG_PREFIX = '[BiliBili Favs]';

/**
 * 输出普通日志
 * @param {...any} args - 日志内容
 */
export function log(...args) {
  console.log(LOG_PREFIX, ...args);
}

/**
 * 输出错误日志
 * @param {...any} args - 日志内容
 */
export function error(...args) {
  console.error(LOG_PREFIX, ...args);
}

/**
 * 输出警告日志
 * @param {...any} args - 日志内容
 */
export function warn(...args) {
  console.warn(LOG_PREFIX, ...args);
}

/**
 * 输出调试日志
 * @param {...any} args - 日志内容
 */
export function debug(...args) {
  console.debug(LOG_PREFIX, ...args);
}

/**
 * 格式化当前时间
 * @returns {string} 格式化的时间字符串 YYYY-MM-DD HH:mm:ss
 */
export function formatTime() {
  const currentDate = new Date();
  const timezoneOffset = currentDate.getTimezoneOffset();
  const timezoneOffsetMilliseconds = timezoneOffset * 60 * 1000;
  const userCurrentDate = new Date(currentDate.getTime() - timezoneOffsetMilliseconds);
  return userCurrentDate.toISOString().replace(/T/, ' ').replace(/\..+/, '');
}
