import { get } from '../../utils/request';

/**
 * 获取订单详情
 */
export function fetchOrderDetail(orderId) {
  const userInfo = wx.getStorageSync('userInfo') || {};
  const phone = userInfo.phone || '';
  return get('/order/detail', {
    id: orderId,
  }, true)
    .then((data) => {
      if (data.code === 0) {
        return data.data;
      }
      throw new Error(data.message || '获取订单详情失败');
    })
    .catch((err) => {
      console.error('fetchOrderDetail error:', err);
      throw err;
    });
}

/**
 * 取消订单
 */
export function cancelOrder(orderId) {
  const userInfo = wx.getStorageSync('userInfo') || {};
  const phone = userInfo.phone || '';

  return get('/order/cancel', {
    phone: phone,
    order_id: orderId,
  }, true)
    .then((data) => {
      if (data.code === 0) {
        return true;
      }
      throw new Error(data.message || '取消订单失败');
    });
}

/**
 * 确认收货
 */
export function confirmReceipt(orderId) {
  const userInfo = wx.getStorageSync('userInfo') || {};
  const phone = userInfo.phone || '';

  return get('/order/confirm', {
    phone: phone,
    order_id: orderId,
  }, true)
    .then((data) => {
      if (data.code === 0) {
        return true;
      }
      throw new Error(data.message || '确认收货失败');
    });
}
