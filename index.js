var express = require("express");
var url = require("url");
var app = express();

app.set("port", (process.env.PORT || 5000));

app.get("/v1", function(request, response) {
    response.json({message: "hello"})
});

app.listen(app.get("port"), function() {
    console.log("Node app is running on port", app.get("port"));
});
