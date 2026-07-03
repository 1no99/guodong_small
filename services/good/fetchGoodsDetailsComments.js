import { get } from '../../utils/request';

/** 获取商品详情页评论数 */
export function getGoodsDetailsCommentsCount(spuId = 0) {
  // 暂时返回空数据，避免前端报错
  // TODO: 对接后端评论统计API
  return Promise.resolve({
    badCount: 0,
    commentCount: 0,
    goodCount: 0,
    goodRate: 0,
    hasImageCount: 0,
    middleCount: 0,
  });
}

/** 获取商品详情页评论 */
export function getGoodsDetailsCommentList(spuId = 0) {
  // 暂时返回空数据，避免前端报错
  // TODO: 对接后端评论列表API
  return Promise.resolve({
    homePageComments: [],
  });
}
