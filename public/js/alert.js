/* eslint-disable */
export const hideAlert = () => {
	const el = document.querySelector('.alert');
	if (el) return el.parentElement.removeChild(el);
};

export const showAlert = (type, msg, time = 7) => {
	hideAlert();
	const html = String.raw;
	const markup = html`<div class="alert alert--${type}">${msg}</div>`;
	document.querySelector('main').insertAdjacentHTML('afterbegin', markup);
	window.setTimeout(hideAlert, time * 1000);
};
