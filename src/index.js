if(require.main == module){
    require("./cli");
}

module.exports = {
    Archive: require("./archive")
}