# 随听 · 交谈时的第二大脑

[手机打开随听](https://tobenot.github.io/booth-brain/) · [MIT](LICENSE)

说中文，给对方看大字译文或点朗读。对方用外语回答，你看中文。听分享或上课时可以关闭「双向翻译」，保留原文，点概念卡看背景。

1. 点「看免 Key 示例」试用，不开麦、不计费。
2. 点「连接我的模型」。百炼北京地域 Key 用于识别和翻译，选填 DeepSeek Key 生成中文概念卡。
3. 选对方语言，征得同意后点「开始对话」。保持页面在前台，说完停顿一下。切到后台会停止收音。

音频直接发给百炼。启用概念卡时，最近十句原文直接发给 DeepSeek。费用记在使用者自己的账号。网站不保存 Key、录音或谈话。朗读使用设备提供的语音。

## 开发与部署

```sh
npm ci && npm test
python3 -m http.server 8000 --bind 127.0.0.1 --directory docs
```

在本机打开 `http://localhost:8000`。部署时将 `docs/` 放到 HTTPS 静态托管即可，无构建步骤、无应用服务器。GitHub Pages 选择 `main` 分支的 `/docs`。

不写代码注释。用命名表达意图，用测试记录行为。`npm test` 同时执行 lint。
