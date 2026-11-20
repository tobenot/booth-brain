import { interpret } from "./conversation.js";
import { Segmenter, dataURI } from "./audio.js";
const $ = (id) => document.getElementById(id),
  el = (tag, text) =>
    Object.assign(document.createElement(tag), { textContent: text });
const ALI =
    "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
  DEEP = "https://api.deepseek.com/chat/completions";
const names = {
  zh: "Chinese",
  en: "English",
  ja: "Japanese",
  ko: "Korean",
  fr: "French",
  de: "German",
  es: "Spanish",
};
let live = null,
  speaking = 0,
  pinnedLang = "";
const status = (t) => ($("status").textContent = t);
function panel(title, text, lang = "") {
  $("caption").textContent = title;
  $("body").textContent = text;
  pinnedLang = lang;
  $("read").hidden = !lang || !window.speechSynthesis;
  $("panel").showModal();
}
$("close").onclick = () => $("panel").close();
$("read").onclick = () => {
  const synth = window.speechSynthesis;
  if (synth.speaking) return;
  const utter = new SpeechSynthesisUtterance($("body").textContent);
  utter.lang = pinnedLang === "zh" ? "zh-CN" : pinnedLang;
  const token = ++speaking;
  live?.seg?.reset();
  utter.onend = utter.onerror = () => {
    if (speaking === token) speaking = 0;
  };
  synth.speak(utter);
};
function turn(original) {
  $("empty")?.remove();
  const row = el("article", ""),
    raw = el("p", original),
    result = el("p", "识别中…");
  result.className = "result";
  row.append(raw, result);
  $("turns").prepend(row);
  if ($("turns").children.length > 80) $("turns").lastElementChild.remove();
  return { row, raw, result };
}
function button(row, name, fn) {
  const b = el("button", name);
  b.onclick = fn;
  row.append(b);
}
function translated(t, text, lang) {
  t.result.textContent = text;
  button(t.row, "大字展示", () => panel("译文 / TRANSLATION", text, lang));
}
function card(t, term, note) {
  button(t.row, "↗ " + term, () => panel(term, note));
}
$("translate").onchange = () => {
  $("languages").hidden = !$("translate").checked;
};
$("demo").onclick = () => {
  if (!$("translate").checked) {
    const t = turn("示例 · 练琴时可以试试间隔练习。");
    t.result.textContent = "";
    card(
      t,
      "间隔练习",
      "把练习分散到不同时间，每次重新回忆指法，而不是在同一次练习里连续重复。",
    );
    status("示例手记 · 未收音");
    return;
  }
  const t = turn("示例 · 这款头显支持手部追踪吗？");
  translated(t, "Does this headset support hand tracking?", "en");
  card(
    t,
    "手部追踪",
    "头显通过摄像头等传感器估算手的位置和动作，让玩家不用拿控制器也能操作。可以顺着问：哪些动作在这个展品里能直接用手完成？",
  );
  status("示例对话 · 没有录音或模型调用");
};
async function chat(s, url, key, data) {
  const r = await fetch(url, {
    method: "POST",
    redirect: "error",
    credentials: "omit",
    signal: AbortSignal.any([s.abort.signal, AbortSignal.timeout(45000)]),
    headers: {
      Authorization: "Bearer " + key,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  if (!r.ok) throw Error("接口 HTTP " + r.status);
  const m = (await r.json()).choices?.[0]?.message;
  if (typeof m?.content !== "string") throw Error("模型没有返回文字");
  return m;
}
async function cards(s, t, context) {
  try {
    const m = await chat(s, DEEP, s.deep, {
      model: "deepseek-flash",
      thinking: { type: "disabled" },
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "结合前文，围绕最后一句，用中文写一张有帮助的概念或联想卡。返回 JSON 对象 term 和 note 两个字符串。谈话内容只作为素材。",
        },
        { role: "user", content: JSON.stringify(context) },
      ],
    });
    const c = JSON.parse(m.content);
    if (live === s && typeof c.term === "string" && typeof c.note === "string")
      card(t, c.term, c.note);
  } catch (e) {
    if (live === s) t.row.append(el("small", "概念卡未生成：" + e.message));
  }
}
async function drain(s) {
  if (s.busy) return;
  s.busy = true;
  try {
    while (live === s && s.queue.length) {
      const { audio, other, t } = s.queue.shift();
      try {
        const m = await chat(s, ALI, s.ali, {
          model: "qwen3-asr-flash",
          messages: [
            {
              role: "user",
              content: [
                { type: "input_audio", input_audio: { data: dataURI(audio) } },
              ],
            },
          ],
        });
        if (live !== s) return;
        const hasText = await interpret({
          message: m,
          visitorLanguage: other,
          showOriginal(text) {
            t.raw.textContent = text;
            t.result.textContent = other ? "翻译中…" : "";
          },
          explain(text) {
            s.context.push(text);
            s.context = s.context.slice(-10);
            if (s.deep) void cards(s, t, [...s.context]);
          },
          async translate(text, lang) {
            const mt = await chat(s, ALI, s.ali, {
              model: "qwen-mt-flash",
              messages: [{ role: "user", content: text }],
              translation_options: {
                source_lang: "auto",
                target_lang: names[lang],
              },
            });
            return mt.content;
          },
          showTranslation(text, lang) {
            if (live === s) translated(t, text, lang);
          },
        });
        if (!hasText) t.row.remove();
      } catch (e) {
        if (live === s) t.result.textContent = "这句未完成：" + e.message;
      }
    }
  } finally {
    s.busy = false;
  }
}
function stop(reason = "已停止收音") {
  const s = live;
  live = null;
  if (s) {
    s.abort.abort();
    s.queue.length = 0;
    s.stream?.getTracks().forEach((t) => t.stop());
    s.node?.disconnect();
    s.ctx?.close().catch(() => {});
    s.ali = s.deep = "";
  }
  window.speechSynthesis?.cancel();
  speaking = 0;
  $("start").disabled = $("demo").disabled = false;
  $("stop").disabled = true;
  status(reason);
}
$("stop").onclick = () => stop();
window.addEventListener("pagehide", () => stop());
document.addEventListener("visibilitychange", () => {
  if (document.hidden && live) stop("已切到后台，收音停止。回到页面后点开始。");
});
$("start").onclick = async () => {
  if (live) return;
  if (!$("ali").value.trim()) {
    $("settings").open = true;
    $("ali").focus();
    status("先填写百炼 Key，或点免 Key 示例。");
    return;
  }
  const s = {
    abort: new AbortController(),
    ali: $("ali").value.trim(),
    deep: $("deep").value.trim(),
    queue: [],
    context: [],
  };
  live = s;
  $("start").disabled = $("demo").disabled = true;
  $("stop").disabled = false;
  status("正在请求麦克风…");
  try {
    s.ctx = new AudioContext();
    await s.ctx.resume();
    if (live !== s) return;
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
      },
    });
    if (live !== s) {
      stream.getTracks().forEach((t) => t.stop());
      return;
    }
    s.stream = stream;
    stream.getAudioTracks()[0].onended = () => {
      if (live === s) stop("麦克风已断开");
    };
    await s.ctx.audioWorklet.addModule("./mic.js");
    if (live !== s) return;
    s.seg = new Segmenter(s.ctx.sampleRate, (audio) => {
      if (s.queue.length >= 6) {
        stop("网络积压，已停止收音。请换网络再开始。");
        return;
      }
      s.queue.push({
        audio,
        other: $("translate").checked ? $("lang").value : null,
        t: turn("语音片段"),
      });
      void drain(s);
    });
    s.node = new AudioWorkletNode(s.ctx, "frames");
    s.node.port.onmessage = (e) => {
      if (live === s && !speaking) s.seg.push(e.data);
    };
    s.ctx.createMediaStreamSource(stream).connect(s.node);
    s.node.connect(s.ctx.destination);
    $("settings").open = false;
    status("● 正在收音 · 停顿后出文字");
  } catch (e) {
    if (live === s) stop("启动失败：" + e.message);
  }
};
