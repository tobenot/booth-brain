import { parse } from "acorn";
import { readdir, readFile } from "node:fs/promises";
import { extname, join } from "node:path";
async function checkFolder(folder) {
  for (const entry of await readdir(folder, { withFileTypes: true })) {
    if ([".git", "node_modules"].includes(entry.name)) continue;
    const name = join(folder, entry.name);
    if (entry.isDirectory()) {
      await checkFolder(name);
      continue;
    }
    const type = extname(name);
    if (![".js", ".html", ".css"].includes(type)) continue;
    const source = await readFile(name, "utf8");
    const comments = [];
    if (type === ".js")
      parse(source, {
        ecmaVersion: "latest",
        sourceType: "module",
        locations: true,
        onComment: comments,
      });
    else
      for (const match of source.matchAll(
        type === ".css" ? /\/\*[\s\S]*?\*\//g : /<!--[\s\S]*?-->/g,
      ))
        comments.push({
          loc: {
            start: { line: source.slice(0, match.index).split("\n").length },
          },
        });
    for (const item of comments) {
      console.error(
        `${name}:${item.loc.start.line}: remove the comment; name the behavior or test it`,
      );
      process.exitCode = 1;
    }
  }
}
await checkFolder(".");
