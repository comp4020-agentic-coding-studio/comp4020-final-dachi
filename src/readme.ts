import { readFile } from "node:fs/promises";
import { marked } from "marked";

const README_PATH = new URL("../README.md", import.meta.url);

const PAGE = (body: string): string => `<!doctype html>
<html lang="en-AU">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>About &mdash; Long Scroll</title>
    <link rel="stylesheet" href="/style.css" />
  </head>
  <body>
    <header class="site-header">
      <p><a href="/">&larr; back to the scroll</a></p>
    </header>
    <main class="readme">
${body}
    </main>
  </body>
</html>
`;

export async function renderReadme(): Promise<string> {
  const markdown = await readFile(README_PATH, "utf8");
  const body = await marked.parse(markdown);
  return PAGE(body);
}
