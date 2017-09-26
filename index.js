var express = require("express");
var url = require("url");
var app = express();

const { Client } = require('pg');

app.set("port", (process.env.PORT || 5000));

app.get("/v1", function(request, response) {
    var query = url.parse(request.url, true).query;

    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: true,
    });

    client.connect();
    client.query("SELECT * FROM scorecard WHERE state = 'CA';")
        .then((res) => {
            response.json({message: "hello", results: JSON.stringify(res.rows)});
        })
        .catch(e => console.log(e.stack))
        .finally(() => client.end())
});

app.listen(app.get("port"), function() {
    console.log("Node app is running on port", app.get("port"));
});
