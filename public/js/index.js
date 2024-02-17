/* eslint-disable */
import { displayMap } from './mapbox';
import { login, logout } from './login';
import { update } from './settings';
import { bookTour } from './stripe';

// DOM Elements
const mapBox = document.querySelector('#map');
const loginForm = document.querySelector('.login');
const logoutBtn = document.querySelector('.nav__el--logout');
const userDataForm = document.querySelector('.form-user-data');
const passwordUpdate = document.querySelector('.form-user-settings');
const bookBtn = document.getElementById('book-tour');

// Delegations
if (mapBox) {
	const locations = JSON.parse(mapBox.dataset.locations);
	displayMap(locations);
}

if (loginForm) {
	loginForm.addEventListener('submit', e => {
		e.preventDefault();
		const email = loginForm.email.value;
		const password = loginForm.password.value;
		login(email, password);
	});
}

if (logoutBtn) logoutBtn.addEventListener('click', logout);

if (userDataForm) {
	userDataForm.addEventListener('submit', e => {
		e.preventDefault();

		const form = new FormData();
		form.append('name', userDataForm.name.value);
		form.append('email', userDataForm.email.value);
		form.append('avatar', userDataForm.avatar.files[0]);

		update(form, 'data');
	});
}

if (passwordUpdate) {
	passwordUpdate.addEventListener('submit', async e => {
		e.preventDefault();

		passwordUpdate.savePassword.textContent = 'Updating';
		const passwordCurrent = passwordUpdate.passwordCurrent.value;
		const password = passwordUpdate.password.value;
		const passwordConfirm = passwordUpdate.passwordConfirm.value;
		await update({ passwordCurrent, password, passwordConfirm }, 'password');
		passwordCurrent.textContent =
			password.textContent =
			passwordConfirm.textContent =
				'';
		passwordUpdate.savePassword.textContent = 'Save password';
	});
}

if (bookBtn) {
	bookBtn.addEventListener('click', e => {
		e.target.textContent = 'Processing';
		const { tourId } = e.target.dataset;
		bookTour(tourId);
	});
}
