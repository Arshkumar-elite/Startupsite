const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

const root = __dirname;
const port = process.env.PORT || 3000;

const contentTypes = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
    ".mp4": "video/mp4",
    ".webm": "video/webm",
    ".ico": "image/x-icon"
};

const server = http.createServer((req, res) => {
    const requestUrl = new URL(req.url, `http://${req.headers.host}`);
    let pathname = decodeURIComponent(requestUrl.pathname);
    if (pathname === "/") pathname = "/index.html";
    const safePath = path.normalize(pathname).replace(/^(\.\.[/\\])+/, "");
    const filePath = path.join(root, safePath);

    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
            res.end("Not Found");
            return;
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = contentTypes[ext] || "application/octet-stream";
        const isVideo = ext === ".mp4" || ext === ".webm";
        const range = req.headers.range;

        if (isVideo && range) {
            const fileSize = stats.size;
            const [startStr, endStr] = range.replace(/bytes=/, "").split("-");
            const start = Math.max(0, parseInt(startStr, 10) || 0);
            const end = Math.min(fileSize - 1, parseInt(endStr, 10) || fileSize - 1);
            const chunkSize = end - start + 1;

            res.writeHead(206, {
                "Content-Range": `bytes ${start}-${end}/${fileSize}`,
                "Accept-Ranges": "bytes",
                "Content-Length": chunkSize,
                "Content-Type": contentType
            });
            fs.createReadStream(filePath, { start, end }).pipe(res);
            return;
        }

        res.writeHead(200, {
            "Content-Type": contentType,
            "Content-Length": stats.size,
            "Accept-Ranges": "bytes"
        });
        fs.createReadStream(filePath).pipe(res);
    });
});

server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
