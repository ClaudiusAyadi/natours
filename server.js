require('dotenv').config();
const mongoose = require('mongoose');

process.on('uncaughtException', err => {
	console.log('⛔ UNCAUGHT EXCEPTION!🚫 Server is shutting down...');
	console.log(`${err.name}: ${err.message}`);
	process.exit(1);
});

const app = require('./app');

const DB = process.env.DB.replace('<PASSWORD>', process.env.DB_PASSWORD);
mongoose.connect(DB).then(() => {
	const port = process.env.PORT || 5000;
	const server = app.listen(port, () =>
		console.log(`DB Connected | Server running on: http://127.0.0.1:${port}`)
	);

	process.on('unhandledRejection', err => {
		console.log('⛔ UNHANDLED REJECTION!🚫 Server is shutting down...');
		console.log(`${err.name}: ${err.message}`);
		server.close(() => process.exit(1));
	});
});
