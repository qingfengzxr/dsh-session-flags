/**
 * Locale namespace of this plugin.
 *
 * The Client half registers these dictionaries with the Harness locale service
 * (`ctx.locale.register`) and passes the namespace to every slot registration,
 * so the framework injects a typed `t` seat into the components. The shared
 * `plugins` page / market metadata lives in `locale/*.json`, which is packaging
 * metadata rather than runtime copy.
 */
import type {} from '@deepseek-ai/dsh-client-ui-slots'

export const LOCALE_NAMESPACE = 'session-flags' as const

/** Simplified Chinese dictionary; its key set is the namespace's source of truth. */
export const zh = {
  'action.label': '设置旗标',
  'menu.label': '设置旗标',
  'mark.label': '旗标：{name}',
  'picker.title': '设置会话旗标',
  'picker.none': '无旗标',
  'picker.manage': '管理旗标颜色',
  'picker.done': '完成',
  'manage.title': '管理旗标颜色',
  'manage.hint':
    '给每种颜色起个名字，帮助区分不同含义的旗标。名字会显示在会话行、悬停卡片和旗标菜单中；清空后恢复默认名称。',
  'manage.nameLabel': '“{name}”的名称',
  'manage.save': '保存',
  'manage.cancel': '取消',
  'dialog.close': '关闭',
  'color.red': '红色',
  'color.orange': '橙色',
  'color.yellow': '黄色',
  'color.green': '绿色',
  'color.teal': '青色',
  'color.blue': '蓝色',
  'color.purple': '紫色',
  'color.pink': '粉色',
  'error.network': '无法连接 DSH 宿主，请重试。',
  'error.response': '宿主返回了无法识别的响应。',
  'error.persist': '保存失败，请重试。',
  'error.load': '读取旗标数据失败，请重试。',
} as const

/** Every dictionary key of the `session-flags` namespace. */
export type SessionFlagsKey = keyof typeof zh

/** English dictionary; exhaustiveness is checked against {@link SessionFlagsKey}. */
export const en: Record<SessionFlagsKey, string> = {
  'action.label': 'Set flag',
  'menu.label': 'Set flag',
  'mark.label': 'Flag: {name}',
  'picker.title': 'Set session flag',
  'picker.none': 'No flag',
  'picker.manage': 'Manage flag colors',
  'picker.done': 'Done',
  'manage.title': 'Manage flag colors',
  'manage.hint':
    'Name each color so flags can carry different meanings. Names appear in the session row, the hover card, and the flag menu. Clear a name to restore the default.',
  'manage.nameLabel': 'Name of “{name}”',
  'manage.save': 'Save',
  'manage.cancel': 'Cancel',
  'dialog.close': 'Close',
  'color.red': 'Red',
  'color.orange': 'Orange',
  'color.yellow': 'Yellow',
  'color.green': 'Green',
  'color.teal': 'Teal',
  'color.blue': 'Blue',
  'color.purple': 'Purple',
  'color.pink': 'Pink',
  'error.network': 'Could not reach the DSH host. Try again.',
  'error.response': 'The DSH host returned an unreadable response.',
  'error.persist': 'Saving failed. Try again.',
  'error.load': 'Loading flag data failed. Try again.',
}

declare module '@deepseek-ai/dsh-client-ui-slots' {
  /** Merge this plugin's namespace into the framework-wide locale map. */
  interface LocaleNamespaceMap {
    'session-flags': SessionFlagsKey
  }
}
