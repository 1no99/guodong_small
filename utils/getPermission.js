/**
 * 获取用户权限
 */
export function getPermission() {
  const userInfo = wx.getStorageSync('userInfo') || {};
  return userInfo.permissions || [];
}

/**
 * 检查是否有某个权限
 */
export function hasPermission(permission) {
  const permissions = getPermission();
  return permissions.includes(permission);
}
