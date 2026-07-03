import { getUserInfo } from '../../utils/auth';

/** 获取个人中心信息 - 直接从缓存读取 */
export function fetchUserCenter() {
  return new Promise((resolve) => {
    try {
      const userInfo = getUserInfo();

      if (userInfo) {
        resolve({
          userInfo: {
            avatarUrl: userInfo.avatar || '',
            nickName: userInfo.nickname || userInfo.username || '用户',
            phoneNumber: userInfo.phone || '',
          },
          countsData: [], // 订单数量数据（如果需要可以另外存储）
          orderTagInfos: [], // 订单标签信息
          customerServiceInfo: {
            servicePhone: '15760083770',
            serviceTimeDuration: '工作日 9:00-18:00',
          },
        });
      } else {
        resolve({
          userInfo: {
            avatarUrl: '',
            nickName: '未登录',
            phoneNumber: '',
          },
          countsData: [],
          orderTagInfos: [],
          customerServiceInfo: {},
        });
      }
    } catch (err) {
      console.error('获取用户信息失败:', err);
      resolve({
        userInfo: {
          avatarUrl: '',
          nickName: '未登录',
          phoneNumber: '',
        },
        countsData: [],
        orderTagInfos: [],
        customerServiceInfo: {},
      });
    }
  });
}

