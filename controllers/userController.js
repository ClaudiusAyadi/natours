const multer = require('multer');
const sharp = require('sharp');
const User = require('../models/User');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const factory = require('./factory');

const storage = multer.memoryStorage();

const filter = (req, file, cb) => {
	if (!file.mimetype.startsWith('image'))
		return cb(
			new AppError('Not an image, please upload an image.', 400),
			false
		);
	cb(null, true);
};

const upload = multer({
	storage: storage,
	fileFilter: filter,
});

exports.avatar = upload.single('avatar');

exports.avatarResizer = catchAsync(async (req, res, next) => {
	if (!req.file) return next();

	const name = req.user.name.split(' ')[0];
	req.file.filename = `${name.toLowerCase()}-${req.user.id}-${Date.now()}.webp`;

	await sharp(req.file.buffer)
		.resize(500, 500)
		.toFormat('webp')
		.webp({ quality: 80 })
		.toFile(`public/img/users/${req.file.filename}`);

	next();
});

const filteredObj = (obj, ...allowedFields) =>
	Object.keys(obj)
		.filter(key => allowedFields.includes(key))
		.reduce((acc, key) => {
			acc[key] = obj[key];
			return acc;
		}, {});

// Get current user
exports.getMe = (req, res, next) => {
	req.params.id = req.user.id;
	next();
};

// Update user (by user)
exports.updateMe = catchAsync(async (req, res, next) => {
	// 1. Disable password update
	if (req.body.password || req.body.passwordConfirm)
		return next(
			new AppError(
				'You cannot update your password here, use /updatePassword instead.',
				400
			)
		);

	// 2. Filter out unwanted fields
	const filteredBody = filteredObj(req.body, 'name', 'email');
	if (req.file) filteredBody.photo = req.file.filename;

	// 3. Update user
	const user = await User.findByIdAndUpdate(req.user.id, filteredBody, {
		new: true,
		runValidators: true,
	});

	// 4. Send
	res.status(200).json({
		status: 'success',
		data: { user },
	});
});

// Delete user (by user) => deactivate user
exports.deleteMe = catchAsync(async (req, res, next) => {
	await User.findByIdAndUpdate(req.user.id, { active: false });

	res.status(204).json({
		status: 'success',
		data: null,
	});
});

exports.createUser = (req, res) => {
	res.status(500).json({
		status: 'error',
		message: 'This route does not exist. Please use /signup instead',
	});
};

exports.getAllUsers = factory.getAll(User, ' users');
exports.getUser = factory.getOne(User, ' user');
exports.updateUser = factory.updateOne(User, ' user'); // do not update password here
exports.deleteUser = factory.deleteOne(User, ' user');
