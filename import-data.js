const fs = require('fs');
const mongoose = require('mongoose');
const Tour = require('./models/Tour');
const User = require('./models/User');
const Review = require('./models/Review');

require('dotenv').config();

const DB = process.env.DB.replace('<PASSWORD>', process.env.DB_PASSWORD);
mongoose.connect(DB).then(() => console.log('Connected to MongoDB'));

// Read tours-simple.json file
const tours = JSON.parse(
	fs.readFileSync(`${__dirname}/dev-data/data/tours.json`)
);
const users = JSON.parse(
	fs.readFileSync(`${__dirname}/dev-data/data/users.json`)
);
const reviews = JSON.parse(
	fs.readFileSync(`${__dirname}/dev-data/data/reviews.json`)
);

const importData = async () => {
	try {
		await Tour.create(tours);
		await User.create(users, { validateBeforeSave: false });
		await Review.create(reviews);
		console.log('Data successfully imported!');
	} catch (err) {
		console.log(err);
	}
	process.exit();
};

const deleteData = async () => {
	try {
		await Tour.deleteMany();
		await User.deleteMany();
		await Review.deleteMany();
		console.log('Data successfully deleted!');
	} catch (err) {
		console.log(err);
	}
	process.exit();
};

if (process.argv[2] === '-i') importData();
else if (process.argv[2] === '-d') deleteData();
