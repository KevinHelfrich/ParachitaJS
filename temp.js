
const fs = require('fs');
const showdown  = require('showdown');
const statik = require('reload-static');

const outDir = "./out/";

const postsDir = "./posts/";
const staticDir = "./static/";

fs.watch(postsDir, (eventType, filename) => {
    gen();
});

fs.watch(staticDir, (eventType, filename) => {
    gen();
});

gen();

const file = new statik.Server(outDir, { cache: false, noCssInject: true, gzip: false });
const server = require('http').createServer(function (request, response) {
    request.addListener('end', function () {
        file.serve(request, response);
    }).resume();
}).listen(8080);

file.setReloadable(server);

function gen() {
    console.log("Generating...");
    if (!fs.existsSync(outDir)){
        fs.mkdirSync(outDir);
    }

    const posts = JSON.parse(fs.readFileSync(postsDir + "config.json"));
    const otherFiles = JSON.parse(fs.readFileSync(staticDir + "config.json"));

    var index = header({title: "Index"});
    index = index + `<h1>Kev The Dev The Blog!</h1>`;

    converter = new showdown.Converter();
    for (const post of posts) {
        const text = fs.readFileSync(postsDir + post.file, 'utf8');
        const html = postHeader(post) + converter.makeHtml(text) + postFooter(post);
        const fileName = titleToHtmlFileName(post);
        fs.writeFileSync(outDir + fileName, html);
        index = index + `
            <a href="/${fileName}">
                <div class="blog-box blog-info-box">
                    <h3>${post.title}</h3>
                    <p>${post.summary}
                </div>
            </a>`;
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

function postHeader(post) {
    return header(post) + `
        <h1>${post.title}</h1>
        <div class="blog-box">
`
}

function postFooter(post) {
    return `
    </div>
    ` + footer(post);
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
