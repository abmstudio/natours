/* eslint-disable */

import '@babel/polyfill';
import { displayMap } from './mapbox';
import { login, logout } from './login';
import { updateSettings } from './updateSettings';
import { bookTour } from './stripe';

window.addEventListener('DOMContentLoaded', () => {
    // DOM ELEMENTS
    const mapBox = document.getElementById('map');
    const loginForm = document.querySelector('.form--login');
    const logOutBtn = document.querySelector('.nav__el--logout');
    const userDataForm = document.querySelector('.form-user-data');
    const userPasswordForm = document.querySelector('.form-user-password');
    const bookBtn = document.querySelector('#book-tour');

    // DELEGATION
    if (mapBox) {
        const locations = JSON.parse(mapBox.dataset.locations);
        const settings = JSON.parse(mapBox.dataset.options);

        displayMap(locations, settings);
    }

    if (loginForm) {
        document.querySelector('.form').addEventListener('submit', e => {
            e.preventDefault();

            // VALUES
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            login(email, password);
        });
    }

    if (logOutBtn) {
        logOutBtn.addEventListener('click', logout);
    }

    if (userDataForm) {
        const elemUpload = userDataForm.querySelector('.form__upload');
        const elemUserPhoto = userDataForm.querySelector('.form__user-photo');

        elemUpload.addEventListener('change', e => {
            const file = userDataForm.getElementById('photo').files[0];
            const reader = new FileReader();

            reader.onload = e => {
                elemUserPhoto.src = e.target.result;
            };

            reader.readAsDataURL(file);
        });

        userDataForm.addEventListener('submit', async e => {
            e.preventDefault();

            // 202. Adding Image Upload to Form
            const form = new FormData();
            form.append('name', document.getElementById('name').value);
            form.append('email', document.getElementById('email').value);
            form.append('photo', document.getElementById('photo').files[0]);

            const btn = document.querySelector('.btn--submit');
            btn.textContent = 'Updating...';

            await updateSettings(form, 'data');

            btn.textContent = 'Save settings';
        });
    }

    if (userPasswordForm) {
        userPasswordForm.addEventListener('submit', async e => {
            e.preventDefault();

            const btn = document.querySelector('.btn--submit');
            btn.textContent = 'Updating...';

            const passwordCurrent = document.getElementById('password-current')
                .value;
            const password = document.getElementById('password').value;
            const passwordConfirm = document.getElementById('password-confirm')
                .value;

            await updateSettings(
                { passwordCurrent, password, passwordConfirm },
                'password'
            );

            btn.textContent = 'Save password';
            document.getElementById('password-current').value = '';
            document.getElementById('password').value = '';
            document.getElementById('password-confirm').value = '';
        });
    }

    if (bookBtn) {
        bookBtn.addEventListener('click', e => {
            e.target.textContent = 'Processing...';
            // const tourId = e.target.dataset.tourId;
            // destructing
            const { tourId } = e.target.dataset;
            bookTour(tourId);
        });
    }
});
