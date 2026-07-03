import { config } from '../../config/index';
import { get } from '../../utils/request';

/** 获取首页数据 */
function mockFetchHome() {
  const { delay } = require('../_utils/delay');
  const { genSwiperImageList } = require('../../model/swiper');
  return delay().then(() => {
    return {
      swiper: genSwiperImageList(),
      tabList: [
        {
          text: '精选推荐',
          key: 0,
        },
        {
          text: '夏日防晒',
          key: 1,
        },
        {
          text: '二胎大作战',
          key: 2,
        },
        {
          text: '人气榜',
          key: 3,
        },
        {
          text: '好评榜',
          key: 4,
        },
        {
          text: 'RTX 30',
          key: 5,
        },
        {
          text: '手机也疯狂',
          key: 6,
        },
      ],
    };
  });
}

/** 获取首页数据 */
export function fetchHome() {
  if (config.useMock) {
    return mockFetchHome();
  }

  // 调用真实后端API
  return get('/banner/list')
    .then((data) => {
      // 后端返回格式: { code: 0, data: [...], message: 'success' }
      if (data.code === 0) {
        return {
          swiper: data.data.map(item => ({
            img: item.image,
            title: item.title || '',
          })),
          tabList: [
            { text: '精选推荐', key: 0 },
            { text: '新品', key: 1 },
            { text: '热销', key: 2 },
          ],
        };
      }
      throw new Error(data.message || '获取首页数据失败');
    })
    .catch((err) => {
      console.error('fetchHome error:', err);
      return mockFetchHome(); // 失败时使用mock数据
    });
}
