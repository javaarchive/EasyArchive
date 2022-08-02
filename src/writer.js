class Writer{
    options;
    /**
     * @type {string} url
     * @memberof Writer
     */
    url;
   
    urlMappings = new Map();
    /**
     * @type {import("./archive.js")}
     * @public
     * @instance
     * @inner
     * @memberof Writer
     */
    archive;

    async init(options){
        
    }
    
    /**
     *
     *
     * @param {import("./archive")} archive
     * @param {string} url
     * @param {any} options
     * @memberof Writer
     */
    async ingest(archive, url, options){
        this.archive = archive;
        this.options = options;
        this.url = url;
    }

    async shutdown(){
        
    }

    getInjection(){

    }
}

module.exports = Writer;