const fs = require('fs');
const path = require('path');

const crypto = require('crypto');

const Jsoning = require('jsoning');

const mime = require('mime-types');

async function exists(directory, autocreate = false){
    let changed = false;
    try{
        await fs.promises.access(directory);
        await fs.promises.stat(directory);
    }catch(ex){
        if(autocreate){
            await fs.promises.mkdir(directory);
            changed = true;
        }
    }
    return changed;
}

class Archive {
    autoextensioning = false;

    /**
     * Creates an instance of Archive.
     * @param {string} directory
     * @param {string} name
     * @param {string} description
     * @memberof Archive
     */
    constructor(directory, name, description){
        this.directory = directory;
        this.manifest = new Jsoning(path.join(this.directory, 'manifest.json'));
        if(name){
            this.setName(name);
        }
        if(description){
            this.setDescription(description);
        }
    }

    async read(){
        this.name = this.manifest.get("name");
        this.description = this.manifest.get("description");
        this.version = this.manifest.get("version");
    }

    setName(newName){
        this.name = newName;
    }

    setDescription(newDescription){
        this.description = newDescription;
    }

    async init(){
        let changed = false;
        changed = changed || (await exists(path.join(this.directory,"files"), true));
        
        if(!(await this.manifest.get("startPages"))){
            await this.manifest.set("startPages",[]);
            changed = true;
        }

        return changed;
    }

    /**
     * Puts metadata into jsoning object thus triggering jsoning save as well.
     *
     * @memberof Archive
     */
    async write(){
        await this.manifest.set("name", this.name);
        await this.manifest.set("description", this.description);
        await this.manifest.set("version", this.version || require("../package.json").version);
    }

    /**
     *
     *
     * @param {Buffer} buf
     * @param {string} [mimetype="application/octet-stream"]
     * @return {string} 
     * @memberof Archive
     */
    async saveFile(buf, mimetype = "application/octet-stream"){
        const hash = crypto.createHash('sha256').update(buf).digest('hex');
        let filename = hash;
        if(this.autoextensioning){
            filename += "." + mime.extension(mimetype);
        }
        let fullPath = path.join(this.directory,"files", filename);

        if(!(await exists(fullPath))){
            // deduplication yay!
            await fs.promises.writeFile(fullPath, buf);
        }

        return fullPath;
    }

    async insertStartPage(filePath){
        await this.manifest.push("startPages", path.basename(filePath));
    }
}

module.exports = Archive;