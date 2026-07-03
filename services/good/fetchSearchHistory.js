import { get, post } from '../../utils/request';

/**
 * 获取搜索历史
 */
export function fetchSearchHistory() {
  return get('/search/history', {}, false)
    .then((data) => {
      if (data.code === 0) {
        return data.data.list || [];
      }
      return [];
    })
    .catch(() => {
      return [];
    });
}

/**
 * 添加搜索历史
 */
export function addSearchHistory(keyword) {
  return post('/search/history/add', {
    keyword: keyword,
  }, false)
    .then((data) => {
      if (data.code === 0) {
        return true;
      }
      return false;
    })
    .catch(() => {
      return false;
    });
}

/**
 * 清空搜索历史
 */
export function clearSearchHistory() {
  return post('/search/history/clear', {}, false)
    .then((data) => {
      if (data.code === 0) {
        return true;
      }
      return false;
    })
    .catch(() => {
      return false;
    });
}
