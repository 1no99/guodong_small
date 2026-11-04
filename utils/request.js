import { config } from '../config/index';

/**
 * 获取存储的token
 */
function getToken() {
  try {
    return wx.getStorageSync('token') || '';
  } catch (e) {
    return '';
  }
}

/**
 * 保存token
 */
function setToken(token) {
  try {
    wx.setStorageSync('token', token);
  } catch (e) {
    console.error('保存token失败', e);
  }
}

/**
 * 清除token
 */
function clearToken() {
  try {
    wx.removeStorageSync('token');
  } catch (e) {
    console.error('清除token失败', e);
  }
}

// 地区受限时统一跳转提示页，避免多个并发请求重复跳转
let regionLimitRedirectAt = 0;

function handleRegionLimit(message) {
  const now = Date.now();
  if (now - regionLimitRedirectAt < 3000) return;

  const pages = getCurrentPages();
  const current = pages[pages.length - 1];
  if (current && current.route === 'pages/region-limit/index') return;

  regionLimitRedirectAt = now;
  wx.reLaunch({
    url: `/pages/region-limit/index?msg=${encodeURIComponent(
      message || '当前地区暂未开放访问',
    )}`,
  });
}

/**
 * 封装wx.request
 * @param {string} url 请求地址
 * @param {object} options 请求配置
 * @returns {Promise}
 */
function request(url, options = {}) {
  const {
    method = 'GET',
    data = {},
    header = {},
  } = options;

  // 有 token 就统一携带，便于后端识别 superadmin 用户（不受地区限制）
  const token = getToken();
  if (token) {
    header['Authorization'] = `Bearer ${token}`;
  }

  // 设置默认header
  header['Content-Type'] = header['Content-Type'] || 'application/json';

  return new Promise((resolve, reject) => {
    wx.request({
      url: `${config.apiBase}${url}`,
      method,
      data,
      header,
      timeout: config.requestTimeout,
      success: (res) => {
        const resData = res.data || {};

        // 地区受限：后端返回 403 + code 3001
        if (res.statusCode === 403 && resData.code === 3001) {
          handleRegionLimit(resData.message);
          reject(new Error(resData.message || '当前地区暂未开放访问'));
          return;
        }

        // 处理响应
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data);
        } else if (res.statusCode === 401) {
          // token过期或未登录
          clearToken();
          wx.showToast({
            title: '请先登录',
            icon: 'none',
          });
          // 跳转到登录页
          setTimeout(() => {
            wx.navigateTo({
              url: '/pages/user/login/index',
            });
          }, 1500);
          reject(new Error('未登录'));
        } else {
          const errorMsg = resData.message || '请求失败';
          wx.showToast({
            title: errorMsg,
            icon: 'none',
          });
          reject(new Error(errorMsg));
        }
      },
      fail: (err) => {
        console.error('请求失败', err);
        wx.showToast({
          title: '网络请求失败',
          icon: 'none',
        });
        reject(err);
      },
    });
  });
}

/**
 * GET请求
 */
function get(url, data = {}, needAuth = false) {
  return request(url, {
    method: 'GET',
    data,
    needAuth,
  });
}

/**
 * POST请求
 */
function post(url, data = {}, needAuth = false) {
  return request(url, {
    method: 'POST',
    data,
    needAuth,
  });
}

/**
 * PUT请求
 */
function put(url, data = {}, needAuth = false) {
  return request(url, {
    method: 'PUT',
    data,
    needAuth,
  });
}

/**
 * DELETE请求
 */
function del(url, data = {}, needAuth = false) {
  return request(url, {
    method: 'DELETE',
    data,
    needAuth,
  });
}

module.exports = {
  request,
  get,
  post,
  put,
  delete: del,
  getToken,
  setToken,
  clearToken,
};
