# Bilingual Fonts · 中英文字体

OpenCode Desktop 的独立 GUI 插件。适配基线为 macOS OpenCode Desktop 2.3.2，当前版本为 `0.1.0-alpha.1`。

## 使用

打开 **设置 → 中英文字体**，在「界面与消息正文」和「代码」下分别选择中文、西文与数字字体。四个选项初始均为「跟随 OpenCode」。选择后立即生效，每组下方都有混排预览。代码设置覆盖 Markdown 行内代码和围栏，可搭配代码块增强插件使用。

下拉菜单提供在当前设备上探测到的常用字体。选择「其他本机字体…」可以输入已安装字体的家族名或 PostScript 名，按 Enter 或移出输入框保存。找不到字体时会显示提示，缺少的字形沿用 OpenCode 当前的字体回退。中文全角标点随中文，半角数字和 ASCII 标点随西文。Emoji 沿用系统回退。

字体选择由本插件的全局存储保存。单项可选回「跟随 OpenCode」，也可以点「恢复默认」清除四项设置。终端使用 OpenCode「外观」中的终端字体。更换主题后字体选择仍然有效。

## 安装与回退

在组件根目录运行：

```sh
npm ci
npm run build
npm test
npm pack
```

将发行包内 `package/` 的文件放在 `~/.config/opencode/plugins/bilingual-fonts/`，完全退出并重新打开 Desktop。在「设置 → 扩展」中停用插件可恢复原生字体显示。

## 实现与验证

插件通过公开的 `SettingsPage`、`Style` 和 `Store.global` 工作。CSS 的 `local()` 和 `unicode-range` 将选定的字符范围分配给本机字体，并优先使用可用的粗体和斜体。Desktop 2.3.2 的渲染窗口权限限制了本地字体枚举，因此选择器采用常用字体与手动输入的名称。

出厂渲染器测试核对正文和代码实际绘制的字形、粗斜体、等宽数字、缺字回退、主题切换、重载和停用恢复。升级宿主后应复核语义字体变量和设置接口。[GUI 注册表](https://github.com/anomalyco/opencode/blob/c0ad18b402eb2827fc1ee71c171b1177b3fc02d1/packages/plugin/src/gui/registries.ts) · [原生字体变量](https://github.com/anomalyco/opencode/blob/c0ad18b402eb2827fc1ee71c171b1177b3fc02d1/packages/app/src/settings/model.tsx#L360)
