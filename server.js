require('dotenv').config();
const mongoose = require('mongoose');

process.on('uncaughtException', err => {
	console.log('⛔ UNCAUGHT EXCEPTION!🚫 Server is shutting down...');
	console.log(`${err.name}: ${err.message}`);
	process.exit(1);
});

const app = require('./app');

const DB = process.env.DB.replace('<PASSWORD>', process.env.DB_PASSWORD);
const port = process.env.PORT || 5000;
const server = app.listen(port, async () => {
	await mongoose.connect(DB);
	console.log(`${mongoose.connection.host} Connected`);
	console.log(`Server running on: ${port}`);
});

process.on('unhandledRejection', err => {
	console.log('⛔ UNHANDLED REJECTION!🚫 Server is shutting down...');
	console.log(`${err.name}: ${err.message}`);
	server.close(() => process.exit(1));
});

process.on('SIGTERM', () => {
	console.log('👋🏼 SIGTERM RECEIVED! Server shutting down gracefully!');
	server.close(console.log(`💥 Process Terminated!`));
});
