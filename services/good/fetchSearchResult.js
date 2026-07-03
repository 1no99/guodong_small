import { get } from '../../utils/request';

/**
 * 搜索商品
 */
export function fetchSearchResult(keyword) {
  return get('/product/search', {
    keyword: keyword,
  }, false)
    .then((data) => {
      if (data.code === 0) {
        return data.data.list || [];
      }
      throw new Error(data.message || '搜索失败');
    })
    .catch((err) => {
      console.error('fetchSearchResult error:', err);
      return [];
    });
}
