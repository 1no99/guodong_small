import { get } from '../../utils/request';

/**
 * 申请售后
 */
export function applyAfterSale(orderId, reason) {
  const userInfo = wx.getStorageSync('userInfo') || {};
  const phone = userInfo.phone || '';

  return get('/order/after-sale/apply', {
    phone: phone,
    order_id: orderId,
    reason: reason,
  }, true)
    .then((data) => {
      if (data.code === 0) {
        return data.data;
      }
      throw new Error(data.message || '申请售后失败');
    });
}

/**
 * 获取售后列表
 */
export function fetchAfterSaleList() {
  const userInfo = wx.getStorageSync('userInfo') || {};
  const phone = userInfo.phone || '';

  return get('/order/after-sale/list', {
    phone: phone,
  }, true)
    .then((data) => {
      if (data.code === 0) {
        return data.data.list || [];
      }
      throw new Error(data.message || '获取售后列表失败');
    });
}
