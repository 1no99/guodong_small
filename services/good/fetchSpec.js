import { get } from '../../utils/request';

/**
 * 获取指定商品的规格列表
 * @param {string|number} spuId - 商品ID
 * @returns {Promise} 规格列表数据
 */
export function fetchSpecList(spuId) {
  return get('/product-spec', { product_id: spuId }, false)
    .then((data) => {
      if (data.code === 0) {
        const specs = data.data || [];
        console.log(`商品 ${spuId} 的规格数据:`, specs);
        // 构建规格ID到规格名称的映射
        const specMap = {};
        specs.forEach((spec) => {
          specMap[spec.id] = spec.spec_name;
        });
        return {
          list: specs,
          map: specMap,
        };
      }
      throw new Error(data.message || '获取规格列表失败');
    })
    .catch((err) => {
      console.error('fetchSpecList error:', err);
      throw err;
    });
}

/**
 * 获取所有商品规格列表（不需要参数）
 * @returns {Promise} 规格列表数据
 */
export function fetchAllSpecs() {
  return get('/product-spec', {}, false)
    .then((data) => {
      if (data.code === 0) {
        const specs = data.data || [];
        console.log('所有规格数据:', specs);
        // 构建规格ID到规格名称的映射
        const specMap = {};
        specs.forEach((spec) => {
          specMap[spec.id] = spec.spec_name;
        });
        return {
          list: specs,
          map: specMap,
        };
      }
      throw new Error(data.message || '获取规格列表失败');
    })
    .catch((err) => {
      console.error('fetchAllSpecs error:', err);
      throw err;
    });
}
