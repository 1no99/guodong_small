import { get } from '../../utils/request';

/**
 * 获取商品详情
 */
export function fetchGood(spuId) {
  console.log('fetchGood: 请求商品ID =', spuId);

  return get(`/product/detail/${spuId}`, {}, false)
    .then((data) => {
      console.log('fetchGood: API返回数据 =', data);

      if (data.code === 0) {
        const product = data.data;

        // 转换数据格式以匹配页面期望的结构
        return {
          ...product,
          id: product.id,
          spuId: product.id,
          spuStockQuantity: product.stock || 0,
          spec_ids: product.spec_ids || '',
          isPutOnSale: product.status !== undefined ? product.status : 1,
          minSalePrice: product.price || 0,
          maxSalePrice: product.price || 0,
          maxLinePrice: product.original_price || 0,
          soldNum: product.sold_num || 0,
          primaryImage: product.main_image || '',
          title: product.name || '',
          thumb: product.main_image || '',
        };
      }
      throw new Error(data.message || '获取商品详情失败');
    })
    .catch((err) => {
      console.error('fetchGood error:', err);
      throw err;
    });
}
