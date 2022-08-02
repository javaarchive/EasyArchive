const Archive = require("./archive");
const Writer = require("./writer");

const { program, Argument } = require('commander');

program
    .name("easyarchive")
    .version("1.0.0")

program
    .command("init [directory]")
    .description("Initalizes an archive in the directory. ")
    .action(async (directory) => {
        let targetDirectory = directory || process.cwd();
        let archive = new Archive(targetDirectory);
        if(await archive.init()){
            console.log("Initalized Archive in", targetDirectory);
        }else{
            console.log("No changes were made. ");
        }
    });

program.
    command("archive <url> [directory]")
    .description("archive a url")
    .option("--writer <type>","writer to use","cheerio")
    .option("--extensionless","auto add extensions (breaks viewing from static site servers)")
    .action(async (url, targetDirectory = process.cwd(), opts) => {
        let archive = new Archive(targetDirectory);
        archive.autoextensioning = !opts.extensionless;

        /** @type {Writer} */
        let SelectedWriter = require("./writers/" + opts.writer);
        let writer = new SelectedWriter();
        await writer.init({});
        console.log("Writer returned: ",await writer.ingest(archive,url,{}));
        await writer.shutdown();
    })

program.parse(process.argv);