/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';

export const login = async (email, password) => {
    try {
        const res = await axios({
            method: 'POST',
            url: 'http://127.0.0.1:3000/api/v1/users/login',
            data: {
                email,
                password
            }
        });

        // 189. Logging in Users With Our API - Part 2
        if (res.data.status === 'success') {
            showAlert('success', 'Logged in successfully!');

            window.setTimeout(() => {
                location.assign('/');
            }, 1500);
        }
    } catch (err) {
        showAlert('success', err.response.data.message);
    }
};

// 191. Logging Out Users
export const logout = async () => {
    try {
        const res = await axios({
            method: 'GET',
            url: 'http://127.0.0.1:3000/api/v1/users/logout'
        });

        if (res.data.status === 'success') {
            // location.reload(true); // important!

            {
                showAlert('success', 'Logout successfully!');

                window.setTimeout(() => {
                    location.assign('/auth/login');
                }, 1500);
            }
        }
    } catch (err) {
        console.log(err.response);
        showAlert('error', 'Error logging out! try again');
    }
};
