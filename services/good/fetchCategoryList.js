import { get } from '../../utils/request';

/** 获取商品分类列表 */
export function getCategoryList() {
  // 调用真实后端API
  return get('/product/category/tree', {}, false)
    .then((data) => {
      if (data.code === 0) {
        const categories = data.data || [];
        return formatCategories(categories);
      }
      throw new Error(data.message || '获取分类列表失败');
    })
    .catch((err) => {
      console.error('getCategoryList error:', err);
      throw err;
    });
}

/**
 * 格式化分类数据为组件需要的格式
 */
function formatCategories(categories) {
  if (!Array.isArray(categories)) {
    return [];
  }

  return categories.map((category) => {
    const item = {
      groupId: String(category.id || category.categoryId || ''),
      name: category.name || category.categoryName || '',
      icon: category.image || category.thumbnail || category.icon || 'https://tdesign.gtimg.com/miniprogram/template/retail/category/category-default.png',
    };

    // 处理子分类
    if (category.children && Array.isArray(category.children)) {
      item.children = formatCategories(category.children);
    }

    return item;
  });
}
