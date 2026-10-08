# 本地PDF解析组件

- PDF.js / pdfjs-dist **6.4.299**，Mozilla Foundation，Apache-2.0：[源码](https://github.com/mozilla/pdf.js)。打包为 miniprogram/vendor/pdf-engine.js，只调用文字提取，不渲染或执行PDF脚本。强制非Node模式及包内静态消息处理器，在同一逻辑线程运行；关闭动态代码生成、WASM、字体及外部资源加载。适配的网络函数始终拒绝。构建脚本与锁文件位于 tools/mobile-pdf-engine。
- Adobe GB1 / UniGB-UCS2-H 压缩字体映射来自PDF.js发行包，按Adobe许可证使用，转为Base64通过微信API读取。
- web-streams-polyfill **4.2.0**、abort-controller **3.0.0**、event-target-shim **5.0.1**、core-js-pure **3.49.0**，MIT，补齐流、取消与精确求和等接口。
- 自有runtime补齐文字编解码、消息克隆和少量缺失语言方法；支持UTF8、UTF16及Latin1编码，其他编码不保证适配。无浏览器页面或HTTP能力。

完整许可证位于 miniprogram/vendor/licenses/。模拟环境测试不能代替微信真机验证；升级后应重验运行环境、字体映射、包大小和真实候选课程。
