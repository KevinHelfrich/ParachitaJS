const fs = require('fs');
const showdown  = require('showdown');

const outDir = "./out/";

const posts = [{
    file: "./posts/first.md",
    title: "First Post!"
}];

const otherFiles = [{
    source: "./static/blogStyle.css",
    destName: "blogStyle.css"
}];

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir);

converter = new showdown.Converter();
for (const post of posts) {
    const text = fs.readFileSync(post.file, 'utf8');
    const html = header(post) + converter.makeHtml(text) + footer(post);
    console.log(html);
    fs.writeFileSync(outDir + titleToHtmlFileName(post), html);
}

for (const file of otherFiles) {
    fs.copyFileSync(file.source, outDir + file.destName);
}

function titleToHtmlFileName(post) {
    var title = post.title;
    title = title.replace(" ", "_");
    title = title.replace(/[^a-zA-Z_]/g, "");
    return title + ".html";
}

function header(post) {
    return `<!DOCTYPE html>
<html>
<head>
<title>Kev's blog - ${post.title}</title>
<link rel="stylesheet" href="blogStyle.css">
</head>
<body>
`
}

function footer(post) {
    return `
</body>
</html>`
}
