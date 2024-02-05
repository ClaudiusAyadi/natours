const mongoose = require('mongoose');
const slugify = require('slugify');

const tourSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: [true, 'Please add a tour name!'],
			unique: true,
			trim: true,
			minlength: [4, 'Name must be at least 4 characters long!'],
		},
		slug: String,
		duration: {
			type: Number,
			required: [true, 'Please add a tour duration!'],
		},
		maxGroupSize: {
			type: Number,
			required: [
				true,
				'Please specify the maximum number of people that can visit here at once!',
			],
		},
		difficulty: {
			type: String,
			required: [true, 'Please add a tour difficulty level!'],
			enum: {
				values: ['easy', 'medium', 'difficult'],
				message: `Use 'easy', 'medium', or 'difficult'`,
			},
		},

		ratingsAverage: {
			type: Number,
			default: 4.5,
			min: [1, 'Rating must be between 1.0 and 5.0'],
			max: [5, 'Rating must be between 1.0 and 5.0'],
			set: val => Math.round(val * 10) / 10,
		},
		ratingsQuantity: {
			type: Number,
			default: 0,
		},
		price: {
			type: Number,
			required: [true, 'Please add a tour price!'],
		},
		priceDiscount: {
			type: Number,
			validate: {
				validator: function (value) {
					// only works on new docs, not for updates
					return value < this.price;
				},
				message: 'Price discount ({VALUE}) must be less than the tour price!',
			},
		},
		summary: {
			type: String,
			required: [true, 'Please add a tour summary!'],
			trim: true,
		},
		description: {
			type: String,
			trim: true,
		},
		imageCover: {
			type: String,
			required: [true, 'Please add a tour cover image!'],
		},
		images: [String],
		startDates: [Date],
		special: {
			type: Boolean,
			default: false,
		},
		startLocation: {
			// GeoJSON
			type: {
				type: String,
				enum: ['Point'],
				default: 'Point',
				required: [true, 'Please add a tour start location!'],
			},
			coordinates: [Number],
			address: String,
			description: String,
		},
		locations: [
			{
				type: {
					type: String,
					enum: ['Point'],
					default: 'Point',
					required: [true, 'Please add a tour start location'],
				},
				coordinates: [Number],
				address: String,
				description: String,
				day: Number,
			},
		],
		guides: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
	},
	{ toJSON: { virtuals: true }, toObject: { virtuals: true } },
	{ timestamps: true }
);

// Indexes
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' });

// Virtuals
tourSchema.virtual('durationInMonths').get(function () {
	return this.duration / 7;
});

// Virtual populate
tourSchema.virtual('reviews', {
	ref: 'Review',
	foreignField: 'tour',
	localField: '_id',
});

// DOCUMENT MIDDLEWARE: runs before .save() & .create() but not .insertMany(), .findByIdAndUpdate(), etc
tourSchema.pre('save', function (next) {
	this.slug = slugify(this.name, { lower: true });
	next();
});

// QUERY MIDDLEWARE
tourSchema.pre(/^find/, function (next) {
	this.find({ special: { $ne: true } });
	next();
});

tourSchema.pre(/^find/, function (next) {
	this.populate({
		path: 'guides',
		select: 'name photo email',
	});

	next();
});

// AGGREGATE MIDDLEWARE
// tourSchema.pre('aggregate', function (next) {
// 	this.pipeline().unshift({ $match: { special: { $ne: true } } });
// });

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
