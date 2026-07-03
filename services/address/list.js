let addressPromise = [];
const ADDRESS_STORAGE_KEY = 'selected_address_for_order';

/** 获取一个地址选择Promise */
export const getAddressPromise = () => {
  let resolver;
  let rejecter;
  const nextPromise = new Promise((resolve, reject) => {
    resolver = resolve;
    rejecter = reject;
  });

  addressPromise.push({ resolver, rejecter });

  return nextPromise;
};

/** 用户选择了一个地址 */
export const resolveAddress = (address) => {
  console.log('===== resolveAddress 被调用 =====');
  console.log('选中的地址:', address);

  const allAddress = [...addressPromise];
  addressPromise = [];

  // 存储到本地存储，供订单确认页面使用
  try {
    wx.setStorageSync(ADDRESS_STORAGE_KEY, address);
    console.log('✅ 地址已保存到存储, key =', ADDRESS_STORAGE_KEY);
    console.log('验证存储结果:', wx.getStorageSync(ADDRESS_STORAGE_KEY));
  } catch (err) {
    console.error('❌ 保存地址到存储失败:', err);
  }

  allAddress.forEach(({ resolver }) => resolver(address));
  console.log('===== resolveAddress 结束 =====');
};

/** 用户没有选择任何地址只是返回上一页了 */
export const rejectAddress = () => {
  const allAddress = [...addressPromise];
  addressPromise = [];

  allAddress.forEach(({ rejecter }) => rejecter(new Error('cancel')));
};
