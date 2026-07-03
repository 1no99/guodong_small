import { get, post } from '../../utils/request';

/**
 * 获取用户信息
 */
export function fetchPersonInfo() {
  const userInfo = wx.getStorageSync('userInfo') || {};
  const phone = userInfo.phone || '';

  return get('/user/info', {
    phone: phone,
  }, true)
    .then((data) => {
      if (data.code === 0) {
        return data.data;
      }
      throw new Error(data.message || '获取用户信息失败');
    })
    .catch((err) => {
      console.error('fetchPersonInfo error:', err);
      throw err;
    });
}

/**
 * 更新用户信息
 */
export function updatePersonInfo(userInfo) {
  const storedUserInfo = wx.getStorageSync('userInfo') || {};
  const phone = storedUserInfo.phone || '';

  return post('/user/update', {
    phone: phone,
    ...userInfo,
  }, true)
    .then((data) => {
      if (data.code === 0) {
        return data.data;
      }
      throw new Error(data.message || '更新用户信息失败');
    });
}
