module.exports = {
    "server": {
        "host": "<%= o2serverHost %>",
        "port": "<%= o2serverCenterPort %>",
        "httpPort": "<%= o2serverWebPort %>",
        "https": <%= isHttps %>
    }
}