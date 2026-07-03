/* eslint-disable no-param-reassign */
import { get } from '../../utils/request';

/** 获取商品列表 */
export function fetchGoodsList(params) {
  const { currentPage = 1, pageSize = 20, categoryId } = params;

  // 构建请求参数，只传递有值的参数
  const queryParams = {
    pageNum: currentPage,
    pageSize,
  };

  // 添加分类ID（可选）
  if (categoryId) {
    queryParams.category_id = categoryId;
  }

  // 添加关键词（可选）
  if (params.keyword) {
    queryParams.keyword = params.keyword;
  }

  // 添加排序参数（可选）
  if (params.sort !== undefined) {
    queryParams.sort = params.sort;
  }
  if (params.sortType !== undefined) {
    queryParams.sortType = params.sortType;
  }

  // 添加价格区间（可选）
  if (params.minPrice) {
    queryParams.minPrice = params.minPrice;
  }
  if (params.maxPrice) {
    queryParams.maxPrice = params.maxPrice;
  }

  return get('/product/list', queryParams)
    .then((data) => {
      if (data.code === 0) {
        // 处理嵌套的数据结构: products.list 或直接的 products 数组
        const productsData = data.data.products || data.data || {};
        const products = productsData.list || productsData || [];

        // 获取总数: 从 pagination.total 或 total 或数组长度
        const total = productsData.pagination?.total || data.data.total || productsData.total || products.length;

        return {
          spuList: products.map((item) => ({
            spuId: item.id,
            id: item.id,
            thumb: item.main_image,
            image: item.main_image,
            title: item.name,
            price: item.price,
            originPrice: item.original_price || item.price,
            desc: item.description || '',
            tags: item.tags || [],
            salesCount: item.sales_count || 0,
          })),
          total: total,
        };
      }
      throw new Error(data.message || '获取商品列表失败');
    })
    .catch((err) => {
      console.error('fetchGoodsList error:', err);
      throw err;
    });
}
