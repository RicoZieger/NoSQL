const express = require('express')
const app = express()

const redis = require("redis");
const client = redis.createClient();

client.on("error", function (err) {
    console.log("Error " + err);
});

app.get('/', function (req, res) {
    res.end('Hello World!');
})

app.get('/hochschule:someText', function (req, res) {		
    client.get(req.url.substring(1), function(err, reply) {   
	    res.end(reply);
    });
})

app.get('/Wirtschaftsinformatik:someText', function (req, res) {
    client.get(req.url.substring(1), function(err, reply) {   
	    res.end(reply);
    });
})

app.get('/security:someText', function (req, res) {
    client.get(req.url.substring(1), function(err, reply) {   
	    res.end(reply);
    });
})

app.listen(3000, function () {
  console.log('Example app listening on port 3000!')
})