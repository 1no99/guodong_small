/**
 * 解析地址字符串
 */
export function parseAddress(addressStr) {
  if (!addressStr) {
    return {
      province: '',
      city: '',
      district: '',
      detail: '',
    };
  }

  // 简单的地址解析逻辑
  // 实际项目中可能需要更复杂的解析或调用第三方服务
  const parts = addressStr.split(/[省市区县]/g).filter(p => p);

  return {
    province: parts[0] || '',
    city: parts[1] || '',
    district: parts[2] || '',
    detail: parts.slice(3).join('') || addressStr,
  };
}

/**
 * 格式化地址
 */
export function formatAddress(addressInfo) {
  const { province, city, district, detail } = addressInfo;
  return `${province || ''}${city || ''}${district || ''}${detail || ''}`;
}
