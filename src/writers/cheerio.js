const WriterBase = require("../writer");

const cheerio = require("cheerio");

const fetch = require("../fetcher");

const fs = require("fs");
const path = require("path");

const defintelyKnownPathAttributes = ["href","src","data-url"];

class CheerioWriter extends WriterBase {
    /**
     *
     *
     * @param {import("../archive.js")} archive
     * @param {string} url
     * @param {any} options
     * @memberof CheerioWriter
     */
    async ingest(archive, url, options){
        super.ingest(archive, url, options);
        let htmlResponse = await fetch(url, options);
        if(!htmlResponse.headers.get("Content-Type").includes("text/html")){
            throw new Error("Expected text/html in first url but got " + htmlResponse.headers.get("Content-Type"));
        }
        const html = await htmlResponse.text();
        const $ = cheerio.load(html);
        await this.rewrite(archive, $, url);
        const newHtml = $.html();
        let startPath = await this.archive.saveFile(Buffer.from(newHtml),htmlResponse.headers.get("Content-Type"));
        await this.archive.insertStartPage(startPath);
        return startPath;
    }

    async fetchResource(realUrl){
        const response = await fetch(realUrl);
        const buffer = await response.buffer();
        if(response.headers.get("Content-Type").includes("text/html")){
            // TODO: Recursive rewrite!
        }
        const path = await this.archive.saveFile(buffer, response.headers.get("Content-Type"));
        return path;
    }

    /**
     * Rewrites a DOM tree
     *
     * @param {import("../archive.js")} archive
     * @param {cheerio.CheerioAPI} $
     * @memberof CheerioWriter
     */
    async rewrite(archive, $, absolute){
        let rewriter = async (index, elem) => {
            try{
                let el = $(elem);
                // console.log(el.attr(),elem,el);
                await Promise.all(Object.keys(el.attr() || {}).map(async attrib => {
                    let value = el.attr(attrib);
                    if(!value){
                        return;
                    }
                    if(!value.includes(":") && defintelyKnownPathAttributes.includes(attrib)){
                        value = (new URL(value, absolute)).toString();
                        if(!value){
                            return;
                        }
                    }
                    
                    if(value.startsWith("http:") || value.startsWith("https:")){
                        let destPath = await this.fetchResource(value);
                        console.log("Rewriting",value,"to",destPath); // TODO: remove debug
                        el.attr(attrib, "/files/" + path.basename(destPath));
                    }
                }));
            }catch(ex){
                console.log(ex);
                // ignore ig
                return;
            }
        }
        
        await Promise.all($("img").map(rewriter));
        await Promise.all($("video").map(rewriter));
        await Promise.all($("link").map(rewriter));
        await Promise.all($("meta").map(rewriter));
        await Promise.all($("script").map(rewriter));
        await Promise.all($("source").map(rewriter));
        await Promise.all($("a").map(rewriter));
    }
}

module.exports = CheerioWriter;