export async function interpret({
  message,
  visitorLanguage,
  explain,
  translate,
  showOriginal,
  showTranslation,
}) {
  const text = message.content.trim();
  if (!text) return false;
  showOriginal(text);
  explain(text);
  if (!visitorLanguage) return true;
  const source = message.annotations?.find((item) => item.language)?.language;
  if (!source) throw Error("未识别语种，请再说一次");
  const target = ["zh", "yue"].includes(source) ? visitorLanguage : "zh";
  showTranslation(await translate(text, target), target);
  return true;
}
