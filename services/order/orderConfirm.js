import { config } from '../../config/index';
import { mockIp, mockReqId } from '../../utils/mock';
import { post } from '../../utils/request';

/** 获取结算mock数据 */
function mockFetchSettleDetail(params) {
  // 模拟延迟
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        code: 'Success',
        data: {},
      });
    }, 300);
  });
}

/** 提交mock订单 */
function mockDispatchCommitPay() {
  // 模拟延迟
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        data: {
          isSuccess: true,
          tradeNo: '350930961469409099',
          payInfo: '{}',
          code: null,
          transactionId: 'E-200915180100299000',
          msg: null,
          interactId: '15145',
          channel: 'wechat',
          limitGoodsList: null,
        },
        code: 'Success',
        msg: null,
        requestId: mockReqId(),
        clientIp: mockIp(),
        rt: 891,
        success: true,
      });
    }, 300);
  });
}

/** 获取结算数据 */
export function fetchSettleDetail(params) {
  if (config.useMock) {
    return mockFetchSettleDetail(params);
  }

  // 结算数据暂时使用mock
  return mockFetchSettleDetail(params);
}

/** 开发票 */
export function dispatchSupplementInvoice() {
  // 模拟延迟
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        code: 'Success',
      });
    }, 300);
  });
}

/* 提交订单 */
export function dispatchCommitPay(params) {
  if (config.useMock) {
    return mockDispatchCommitPay(params);
  }

  const { addressId, items } = params;

  // 获取用户手机号
  const userInfo = wx.getStorageSync('userInfo') || {};
  const phone = userInfo.phone || '';
  const user_num = userInfo.user_num || '';

  if (!phone) {
    return Promise.reject(new Error('请先登录'));
  }
console.log(params);
  // 调用真实后端API
  return post('/order/create', {
    phone: phone,
    userNum:user_num,
    address_id: addressId,
    items: items.map(item => ({
      act_num_id: item.act_num_id,
      product_id: item.spuId,
      quantity: item.quantity,
      price: item.price,
      spec:item.spec
    })),
  }, true)
    .then((data) => {
      if (data.code === 0) {
        return {
          isSuccess: true,
          tradeNo: data.data.order_no,
          orderId: data.data.id,
        };
      }
      throw new Error(data.message || '提交订单失败');
    });
}
