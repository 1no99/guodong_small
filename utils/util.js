/**
 * 格式化时间
 */
export function formatTime(date) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hour = date.getHours();
  const minute = date.getMinutes();
  const second = date.getSeconds();

  return `${[year, month, day].map(formatNumber).join('/')} ${[hour, minute, second].map(formatNumber).join(':')}`;
}

function formatNumber(n) {
  const str = n.toString();
  return str[1] ? str : `0${str}`;
}

/**
 * COS 缩略图 URL
 */
export function cosThumb(url, width = 200, height = 200) {
  if (!url) return '';
  // 如果已经是 COS 域名，添加缩略图参数
  if (url.includes('cloud.tencent.com')) {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}imageView2/2/w/${width}/h/${height}`;
  }
  return url;
}

/**
 * 防抖函数
 */
export function debounce(fn, delay = 300) {
  let timer = null;
  return function (...args) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
}

/**
 * 节流函数
 */
export function throttle(fn, delay = 300) {
  let lastTime = 0;
  return function (...args) {
    const now = Date.now();
    if (now - lastTime >= delay) {
      lastTime = now;
      fn.apply(this, args);
    }
  };
}
