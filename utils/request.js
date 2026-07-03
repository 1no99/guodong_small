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
    needAuth = false,
  } = options;

  // 添加认证token
  if (needAuth) {
    const token = getToken();
    if (token) {
      header['Authorization'] = `Bearer ${token}`;
    }
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
          const errorMsg = res.data?.message || '请求失败';
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
