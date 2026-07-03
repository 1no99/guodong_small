import { config } from '../../config/index';
import { post } from '../../utils/request';

/**
 * 微信登录
 * @param {string} code - 微信登录code
 */
export function wechatLogin(code) {
  if (config.useMock) {
    // Mock微信登录
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          code: 0,
          message: '登录成功',
          data: {
            token: 'mock_wechat_token_' + Date.now(),
            user: {
              id: 1,
              username: '微信用户',
              nickname: '微信用户',
              avatar: '',
              phone: '',
            },
          },
        });
      }, 500);
    });
  }

  // 调用真实后端API
  return post('/user/login/wechat', {
    code,
  })
    .then((data) => {
      // 直接返回后端响应，由页面层决定如何存储
      return data;
    });
}

/**
 * 绑定手机号
 * @param {string} phone - 用户输入的手机号
 * @param {string} username - 用户昵称（存储到username字段）
 * @param {string} avatar - 头像base64
 */
export function bindPhone(phone, username, avatar) {
  if (config.useMock) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          code: 0,
          message: '绑定成功',
          data: {
            token: 'mock_phone_token_' + Date.now(),
            user: {
              id: 1,
              username: username || '微信用户',
              nickname: username || '微信用户',
              avatar: avatar || '',
              phone: phone,
            },
          },
        });
      }, 500);
    });
  }

  return post('/user/bindPhone', { phone, username, avatar }, true).then((data) => {
    if (data.code === 0) {
      return data;
    }
    throw new Error(data.message || '绑定手机号失败');
  });
}

/**
 * 退出登录
 */
export function logout() {
  const { clearToken } = require('../../utils/request');
  clearToken();

  // 可以在这里调用后端的登出接口（如果有的话）
  return Promise.resolve({
    code: 0,
    message: '退出成功',
  });
}

/**
 * 检查登录状态
 */
export function checkLogin() {
  const { getToken } = require('../../utils/request');
  const token = getToken();
  return !!token;
}

/**
 * 获取用户信息
 */
export function getUserInfo() {
  const { get } = require('../../utils/request');

  // 先从本地存储获取
  const localUserInfo = wx.getStorageSync('userInfo');
  if (localUserInfo) {
    console.log('从本地存储获取用户信息:', localUserInfo);
    return Promise.resolve({
      code: 0,
      data: localUserInfo
    });
  }

  if (config.useMock) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          code: 0,
          data: {
            id: 1,
            username: 'test',
            nickname: '测试用户',
            avatar: '',
            phone: '13800138000',
          },
        });
      }, 300);
    });
  }

  return get('/user/info', {}, true)
    .then((data) => {
      if (data.code === 0) {
        return data;
      }
      throw new Error(data.message || '获取用户信息失败');
    });
}

/**
 * 更新用户信息
 * @param {object} userInfo - 用户信息
 */
export function updateUserInfo(userInfo) {
  const { put } = require('../../utils/request');

  if (config.useMock) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          code: 0,
          message: '更新成功',
          data: {
            ...userInfo,
            id: 1,
          },
        });
      }, 300);
    });
  }

  return put('/user/info', userInfo, true)
    .then((data) => {
      if (data.code === 0) {
        return data;
      }
      throw new Error(data.message || '更新用户信息失败');
    });
}
