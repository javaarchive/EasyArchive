# Easily make archives of webpages
Note: I highly recommend pinning a version for this package so you don't get suprises because it's not very good at upgrading files between versions.  
## Initalize archive structure

`easyarchive init`

You can optionally specify a directory like this:

`easyarchive init /tmp/archivetest`

## Archive a url
### Normal

`easyarchive archive https://npmjs.com`

### Select a writer
Only `cheerio` exists at the moment. 

`easyarchive archive --writer=cheerio https://npmjs.com`