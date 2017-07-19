/**
 * A very simple server - serve static files from the root folder with Allow-Origin:* header
 * Generally it is a bad idea, as it is no way to deal with security issues, but this is only for the demo sack
 * Created by yuval on 19/07/17.
 */
const express = require('express');
const path = require('path');
const app = express();

var options = {
    setHeaders: function (res) {
        res.set('Access-Control-Allow-Origin', '*')
    }
};
app.use('/', express.static(path.join(__dirname), options));

app.listen(3000, function () {
    console.log('Example app listening on port 3000!')
});