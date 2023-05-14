const fs = require('fs');
const showdown  = require('showdown');

const outDir = "./out/";

const postsDir = "./posts/";
const staticDir = "./static/";

const posts = [{
    file: "first.md",
    title: "First Post!",
    summary: "This post is a cool post about the process of writing posts"
}];

const otherFiles = [{
    file: "blogStyle.css",
    destName: "blogStyle.css"
}];

fs.watch(postsDir, (eventType, filename) => {
    gen();
});

fs.watch(staticDir, (eventType, filename) => {
    gen();
});

gen();

function gen() {
    console.log("Generating...");
    if (!fs.existsSync(outDir)){
        fs.mkdirSync(outDir);
    }

    var index = header({title: "Index"});
    index = index + `<h1>Blogs!</h1>`;

    converter = new showdown.Converter();
    for (const post of posts) {
        const text = fs.readFileSync(postsDir + post.file, 'utf8');
        const html = header(post) + converter.makeHtml(text) + footer(post);
        const fileName = titleToHtmlFileName(post);
        fs.writeFileSync(outDir + fileName, html);
        index = index + `
    <a href="/${fileName}"><h3>${post.title}</h3></a>
    <p>${post.summary}`;
    }

    index = index + footer();
    fs.writeFileSync(outDir + "index.html", index);

    for (const file of otherFiles) {
        fs.copyFileSync(staticDir + file.file, outDir + file.destName);
    }
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

