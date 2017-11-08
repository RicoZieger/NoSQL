var url = 'mongodb://localhost:27017/Uebung2';
var mongo = require('mongodb').MongoClient

mongo.connect(url, function(err, db) {
	console.log("Connected correctly to server");
	
	var students = db.collection('Students');

	//Blatt ExercicemongoDB_1 Aufgabe 2.1	
	students.find({}).toArray(function(err, documents){
		console.log(documents);
		console.log("################################");
		db.close();
	});
	
	//Blatt ExercicemongoDB_1 Aufgabe 2.2	
	students.find({status:"extern"}).toArray(function(err, documents){
		console.log(documents);
		console.log("################################");
		db.close();
	});
	
	//Blatt ExercicemongoDB_1 Aufgabe 2.3	
	students.find({age:{$gt:20}}).toArray(function(err, documents){
		console.log(documents);
		console.log("################################");
		db.close();
	});
	
	//Blatt ExercicemongoDB_1 Aufgabe 2.4	
	students.find({name:"Daniel"},{_id:0,name:1,age:1}).toArray(function(err, documents){
		console.log(documents);
		console.log("################################");
		db.close();
	});	
	
	//Blatt ExercicemongoDB_1 Aufgabe 3.1	
	students.insert({name:"Jascha", age:12, status:"intern", semesters:11}, function(err, data){});
	
	//Blatt ExercicemongoDB_1 Aufgabe 3.2	
	students.insert([
		{name:"Michael", age:25, status:"intern", semesters:1},
		{name:"Patrick", age:11, status:"extern", semesters:2},
		{name:"Michele", age:27, status:"extern", semesters:7}
	], function(err, data){});	
	
	/*
	//Blatt ExercicemongoDB_1 Aufgabe 3.3	
	students.find({name:"Michael"}).toArray(function(err, documents){		
		var myquery = { _id: documents[0]._id};
		var newvalues = { semesters: 2};
		students.updateOne(myquery, newvalues, function(err, res) {
				if (err) throw err;
				console.log("Michael updated");
				db.close();
		});
	});		
	
	students.find({name:"Patrick"}).toArray(function(err, documents){		
		var myquery = { _id: documents[0]._id};
		var newvalues = { age: 13};
		students.updateOne(myquery, newvalues, function(err, res) {
				if (err) throw err;
				console.log("Patrick updated");
				db.close();
		});
	});	
*/	
	
	//Blatt ExercicemongoDB_1 Aufgabe 4
	students.remove({name:"Uta"});
	students.remove({name:"Michele"});
	
	//Blatt ExercicemongoDB_1 Aufgabe 5
	students.aggregate([
		{$match:{status:"intern"}},
		{$group:{_id:'age', avgSum:{$avg: '$age'}}}
	]).toArray(function(err, results){
		console.log("Avg age intern students: "+results[0].avgSum);
	});
	students.aggregate([
		{$match:{status:"extern"}},
		{$group:{_id:'age', avgSum:{$avg: '$age'}}}
	]).toArray(function(err, results){
		console.log("Avg age extern students: "+results[0].avgSum);
	});
	students.aggregate([
		{$match:{status:"intern"}},
		{$group:{_id:'semesters', semSum:{$sum: '$semesters'}}}
	]).toArray(function(err, results){
		console.log("Combined semesters of intern students: "+results[0].semSum);
	});
	students.aggregate([
		{$match:{status:"extern"}},
		{$group:{_id:'semesters', semSum:{$sum: '$semesters'}}}
	]).toArray(function(err, results){
		console.log("Combined semesters of extern students: "+results[0].semSum);
	});
	
	
	//Reset data so that program can run again
	students.insert({name: "Uta", age: 13, status: "extern", semesters: 7});
	students.remove({name:"Jascha"});
	students.remove({name:"Michael"});
	students.remove({name:"Patrick"});	
	
	
});	
