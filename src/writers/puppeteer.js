const WriterBase = require("../writer");

const puppeteer = require("puppeteer");
const path = require("path");

class PuppeteerWriter extends WriterBase {

    async init(options){
        this.browser = await puppeteer.launch(options.pptrOpts || {
            headless: false,
            defaultViewport: null 
        });
    }

    /**
     *
     *
     * @param {import("../archive.js")} archive
     * @param {string} url
     * @param {any} options
     * @memberof PuppeteerWriter
     */
     async ingest(archive, url, options){
        super.ingest(archive, url, options);
        this.tab = await this.browser.newPage();
        this.tab.on("response", async (response) => {
            // console.log("url", response.url());
            try{
                if(response.url().startsWith("data:") || response.url().startsWith("blob:")){
                    return;
                }

                let destination = await this.archive.saveFile(await response.buffer(), await response.headers()["content-type"]);
                console.log("saved ",response.url(),"to",destination);
                this.urlMappings.set(response.url(), "/files/" + path.basename(destination));
            }catch(e){
                console.warn(e,response.url());
            }
        });
        await this.tab.goto(url, {
            timeout: options.timeout || 10 * 1000
        });
        await this.tab.waitForNetworkIdle();
        await this.tab.waitForTimeout(options.finalTimeout || 5 * 1000);
        // console.log("Doing rewrite",Object.fromEntries(this.urlMappings));
        // Rewrite main page
        await this.tab.evaluate((mapping) => {
            // Rewrite findable paths
            Array.from(document.getElementsByTagName("*")).forEach(el => {
                el.getAttributeNames().forEach(attrib => {
                    if(el[attrib] && mapping[el[attrib]]){
                        el[attrib] = mapping[el[attrib]];
                    }else if(mapping[el.getAttribute(attrib)]){
                        el.setAttribute(attrib, mapping[el.getAttribute(attrib)]);
                    }
                });
            });
            // Inject url mapping for future scripts?
            let scr = document.createElement("script");
            scr.textContent = JSON.stringify(mapping);
            scr.type = "application/json";
            scr.id = "archive-url-mappings";
            document.body.appendChild(scr);
            // TODO: Inject script that redirects XHR and fetch
        }, Object.fromEntries(this.urlMappings));
        // Save page
        let html = await this.tab.content();
        let startPath = await this.archive.saveFile(Buffer.from(html), "text/html");
        await this.archive.insertStartPage(startPath);
        await this.tab.close();
        return startPath;
     }

     async shutdown(){
        await this.browser.close();
     }
}

module.exports = PuppeteerWriter;