const mongoose = require('mongoose');

process.on('uncaughtException', error => {
	console.log('⛔ UNCAUGHT EXCEPTION!🚫 Server is shutting down...');
	console.log(`${error.name}: ${error.message}`);
	process.exit(1);
});

const app = require('./app');

const DB = process.env.DB.replace('<PASSWORD>', process.env.DB_PASSWORD);
const port = process.env.PORT || 0;
const server = app.listen(port, async () => {
	mongoose.set('strictQuery', false);
	await mongoose.connect(DB);
	console.log(`Connected: ${mongoose.connection.host}`);
	console.log(`PORT: ${port}`);
	console.log(`App is live 🎉`);
});

process.on('unhandledRejection', error => {
	console.log('⛔ UNHANDLED REJECTION!🚫 Server is shutting down...');
	console.log(`${error.name}: ${error.message}`);
	server.close(() => process.exit(1));
});

process.on('SIGTERM', () => {
	console.log('👋🏼 SIGTERM RECEIVED! 💥 Process Terminated!');
	server.close(() => {
		console.log('Server shutting down gracefully!');
		process.exit(1);
	});
});
