var express = require("express");
var url = require("url");
var app = express();

const { Client } = require('pg');
const client = new Client();

app.set("port", (process.env.PORT || 5000));

app.get("/v1", function(request, response) {
    var query = url.parse(request.url, true).query;

    client.connect();
    client.query("SELECT * FROM scorecard WHERE state = 'CA'")
        .then(res => console.log(res.rows[0]))
        .catch(e => console.log(e.stack));

    response.json({message: "hello"});
});

app.listen(app.get("port"), function() {
    console.log("Node app is running on port", app.get("port"));
});
