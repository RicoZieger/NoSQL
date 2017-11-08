const express = require('express')
const app = express()

var url = 'mongodb://localhost:27017/myDB';
var mongo = require('mongodb').MongoClient
var mongoose = require('mongoose');

app.listen(3000, function () {
  console.log('Example app listening on port 3000!')
})

// ############## Anlegen eines Schemas + Daten mit Moogoose ############### //
mongoose.connect(url);
var mongooseDBConnection = mongoose.connection;
mongooseDBConnection.on('error', console.error.bind(console, 'connection error:'));
mongooseDBConnection.once('open', function() {
	var catsSchema = mongoose.Schema({
		name: String,
		age: Number,
		color: String,
		height: Number,
		weight: Number
	});
	
	var profSchema = mongoose.Schema({
		name: String,
		prename: String,
		age: Number,
		course: String		
	});
	
	var CatsModel = mongoose.model('cats', catsSchema, 'cats');
	var ProfModel = mongoose.model('professor', profSchema, 'professor');
	
	var katze1 = new CatsModel({ name: 'Katze1', age: 10, color: 'Braun', height: 28, weight: 12 });
	var katze2 = new CatsModel({ name: 'Katze2', age: 11, color: 'Weiß', height: 27, weight: 11 });
	var katze3 = new CatsModel({ name: 'Katze3', age: 12, color: 'Schwarz', height: 26, weight: 10 });
	var katze4 = new CatsModel({ name: 'Katze4', age: 13, color: 'Grau', height: 25, weight: 9});
	var katze5 = new CatsModel({ name: 'Katze5', age: 14, color: 'Lila blassblau kariert', height: 24, weight: 8 });
	
	var prof1 = new ProfModel({ name: 'Knauber', prename: 'Peter', age:44, course: 'AGI'});
	var prof2 = new ProfModel({ name: 'Schramm', prename: 'Wolfgang', age:64, course: 'ADS'});
	var prof3 = new ProfModel({ name: 'Todorov', prename: 'Yordan', age:34, course: 'ANA'});
	var prof4 = new ProfModel({ name: 'Kraus', prename: 'Martina', age:32, course: 'NoSQL'});
	var prof5 = new ProfModel({ name: 'Smits', prename: 'Thomas', age:44, course: 'LSD'});
	
	katze1.save(function (err, katze1) {
		if (err) return console.error(err); 
	});
	katze2.save(function (err, katze2) {
		if (err) return console.error(err); 
	});
	katze3.save(function (err, katze3) {
		if (err) return console.error(err); 
	});
	katze4.save(function (err, katze4) {
		if (err) return console.error(err); 
	});
	katze5.save(function (err, katze5) {
		if (err) return console.error(err); 
	});
	
	prof1.save(function (err, prof1) {
		if (err) return console.error(err); 
	});
	prof2.save(function (err, prof2) {
		if (err) return console.error(err); 
	});
	prof3.save(function (err, prof3) {
		if (err) return console.error(err); 
	});
	prof4.save(function (err, prof4) {
		if (err) return console.error(err); 
	});
	prof5.save(function (err, prof5) {
		if (err) return console.error(err); 
	});	
});

// ############## Anlegen eines Dokuments ############### //

app.get('/cats/set:true*', function (req, res) {	
	mongo.connect(url, function(err, db) {
		var requestURL = req.url;
		requestURL = requestURL.substring("/cats/set:true".length);
				
		var name = getParameterOfFieldInUrl("name",requestURL);
		var age = getParameterOfFieldInUrl("age",requestURL);
		var color = getParameterOfFieldInUrl("color",requestURL);
		var height = getParameterOfFieldInUrl("height",requestURL);
		var weight = getParameterOfFieldInUrl("weight",requestURL);
		
		var response = "Das Dokument wird angelegt...";
		response = appendErrorMessageIfNecessary(name, "name", response);
		response = appendErrorMessageIfNecessary(age, "age", response);
		response = appendErrorMessageIfNecessary(color, "color", response);
		response = appendErrorMessageIfNecessary(height, "height", response);
		response = appendErrorMessageIfNecessary(weight, "weight", response);		
		
		var JSONObject = new Object();
		addFieldToJSON(JSONObject, name, "name", false);
		addFieldToJSON(JSONObject, age, "age", true);
		addFieldToJSON(JSONObject, color, "color", false);
		addFieldToJSON(JSONObject, height, "height", true);
		addFieldToJSON(JSONObject, weight, "weight", true);		
		
		db.collection('cats').insert(JSONObject, function(err, data){
			if(err)
				response = response.concat("<br><br>Fehler beim Anlegen des Dokuments: "+err);
			else
				response = response.concat("<br><br>Das Dokument wurde erfolgreich angelegt");
			res.send(response);
		});
	});
});

app.get('/professor/set:true*', function(req, res){	
	mongo.connect(url, function(err, db) {
		var requestURL = req.url;
		requestURL = requestURL.substring("/professor/set:true".length);
		
		var name = getParameterOfFieldInUrl("name",requestURL);
		var prename = getParameterOfFieldInUrl("prename",requestURL);
		var age = getParameterOfFieldInUrl("age",requestURL);
		var course = getParameterOfFieldInUrl("course",requestURL);		
		
		var response = "Das Dokument wird angelegt...";
		response = appendErrorMessageIfNecessary(name, "name", response);
		response = appendErrorMessageIfNecessary(prename, "prename", response);
		response = appendErrorMessageIfNecessary(age, "age", response);
		response = appendErrorMessageIfNecessary(course, "course", response);			
		
		var JSONObject = new Object();
		addFieldToJSON(JSONObject, name, "name", false);
		addFieldToJSON(JSONObject, prename, "prename", false);
		addFieldToJSON(JSONObject, age, "age", true);
		addFieldToJSON(JSONObject, course, "course", false);		
		
		db.collection('professor').insert(JSONObject, function(err, data){
			if(err)
				response = response.concat("<br><br>Fehler beim Anlegen des Dokuments: "+err);
			else
				response = response.concat("<br><br>Das Dokument wurde erfolgreich angelegt");
			res.send(response);
		});
	});
});

// ############## Abfragen eines Dokuments ############### //

app.get('/cats/*', function (req, res) {	
    mongo.connect(url, function(err, db) {
		var requestURL = req.url;
		var JSONObject = new Object();
		requestURL = requestURL.substring("/cats/".length);
		
		if(requestURL.length > 0){
			var parameter = requestURL.substring(0,requestURL.indexOf(":"));
			var parameterValue = requestURL.substring(requestURL.indexOf(":")+1);
			JSONObject[parameter] = parameterValue;					
		}				
		
		db.collection('cats').find(JSONObject).toArray(function(err, documents){
			res.send(documents);
			db.close();		
		});	

	});
});

app.get('/professor/*', function (req, res) {	
    mongo.connect(url, function(err, db) {
		var requestURL = req.url;
		var JSONObject = new Object();
		requestURL = requestURL.substring("/professor/".length);
		
		if(requestURL.length > 0){
			var parameter = requestURL.substring(0,requestURL.indexOf(":"));
			var parameterValue = requestURL.substring(requestURL.indexOf(":")+1);	
			JSONObject[parameter] = parameterValue;
		}
		
		db.collection('professor').find(JSONObject).toArray(function(err, documents){
			res.send(documents);
			db.close();		
		});		
	});
});

// ############## Hilfsfunktionen ############### //

function getParameterOfFieldInUrl(fieldName, url){
	var fieldNameString = "/"+fieldName+":";
	if(url.includes(fieldNameString)){
		var result = url.substring((url.indexOf(fieldNameString)+fieldNameString.length));
		if(result.includes("/"))
			result = result.substring(0, result.indexOf("/"));
		
		return result;
	}else{
		return null;
	}
}

function appendErrorMessageIfNecessary(field, fieldName, errorMessages){
	if(field === null)
		return errorMessages.concat("<br>Warning: Feld '"+fieldName+"' wurde nicht gesetzt");
	return errorMessages;
}

function addFieldToJSON(JSON, content, fieldName, isInt){
	if(content){
		if(isInt)
			JSON[fieldName] = parseInt(content);
		else
			JSON[fieldName] = content;
	}
	
}