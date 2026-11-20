# Booth Brain · 展会第二大脑

A pocket interpreter for a noisy show floor. Show your visitor a translation in large type, and keep the background notes on your side. Static HTML, CSS and JavaScript. No build, application server, analytics or bundled keys.

**试用：** 打开网页后选「看免 Key 示例」。真实对话在「连接我的模型」填写北京地域的百炼 Key，可选填 DeepSeek Key 用于概念卡。选对方语言，点「开始对话」。请告知在场的人。点大字展示和朗读时，当前句固定在屏幕上。

## Run / deploy

```sh
python3 -m http.server 8000 --bind 127.0.0.1 --directory docs
```

Open `http://localhost:8000` on the same machine. For a phone, serve `docs/` over HTTPS. GitHub Pages: **Settings → Pages → Deploy from a branch → main → /docs → Save**. Alternatively upload the contents of `docs/` to an HTTPS static host. No environment variables or build command.

## How it works

The browser segments audio on pauses (or after 10 seconds of continuous speech) and encodes WAV. It sends each segment to Qwen ASR, reads the language annotation, and sends the text to Qwen MT. Chinese/Cantonese is translated to the selected visitor language; other recognized languages are translated to Chinese. Optional DeepSeek concept cards use the last ten utterances. Translation and cards do not wait on each other. Speech playback uses the device's voices. This is sentence-based, not streaming interpretation.

Audio and recognized text go to Alibaba Cloud; if enabled, recognized text also goes to DeepSeek. Billing is on the user's accounts. Keys and conversation stay in page memory on the app side: refresh/close to clear. Hosting sees static requests, not conversations. Stopping capture cancels pending work; switching away stops the microphone. In a loud room, noise may be mistaken for speech. Check live API access and voices on your device before relying on it at an event.

[Qwen ASR](https://help.aliyun.com/zh/model-studio/qwen-asr-api-reference) · [Qwen MT](https://help.aliyun.com/zh/model-studio/machine-translation/) · [DeepSeek](https://api-docs.deepseek.com/) · [MIT license](LICENSE)
