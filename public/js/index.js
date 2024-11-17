/* eslint-disable */
import '@babel/polyfill';
import { displayMap } from './mapbox';
import { login, logout, signup } from './accountConfig';
import { accountUpdateSettings } from './accountUpdate';
import { createUpdateReview } from './reviewsSystem';
import { checkoutPayment } from './stripe';
import { showAlert } from './alert';

// DOM ELEMENTS
const mapBox = document.getElementById('map');
const loginForm = document.querySelector('.login-form');
const registerForm = document.querySelector('.registration-form');
const logoutButton = document.querySelector('.nav__el--logout');
const formUserData = document.querySelector('.form-user-data');
const formUserPassword = document.querySelector('.form-user-password');
const bookBtn = document.getElementById('book-tour');
const formReview = document.querySelector('.form__review-cu');
const userPhoto = document.querySelector('.form__user-photo');
const saveBtns = document.querySelectorAll('label.container__fav input');
const alertBodyMessage = document.querySelector('body').dataset.alert;
console.log('message:', alertBodyMessage); // debug: remove this

// DELEGATION
if (mapBox) {
  const locations = JSON.parse(mapBox.dataset.locations);
  displayMap(locations);
}

if (loginForm)
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    login(email, password);
  });

if (registerForm)
  registerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('confirmPassword').value;

    signup(name, email, password, passwordConfirm);
  });

if (logoutButton) logoutButton.addEventListener('click', logout);

if (formUserData) {
  // info: prevent from updatin the data when nothing has changed
  formUserData.querySelector('.btn').disabled = true;
  const form = new FormData();

  function handleSaveUserData() {
    // info: clear the previous values and append them again (efficiency)
    form.delete('name');
    form.delete('email');
    form.delete('photo');

    document.getElementById('name').value &&
      form.append('name', document.getElementById('name').value);
    document.getElementById('email').value &&
      form.append('email', document.getElementById('email').value);
    document.getElementById('photo').files[0] &&
      form.append('photo', document.getElementById('photo').files[0]);

    formUserData.querySelector('.btn').disabled = false;
  }

  document.getElementById('name').addEventListener('input', handleSaveUserData);
  document
    .getElementById('email')
    .addEventListener('input', handleSaveUserData);
  document
    .getElementById('photo')
    .addEventListener('change', handleSaveUserData);

  formUserData.addEventListener('submit', async (e) => {
    e.preventDefault();
    document.querySelector('.btn--update').innerText = 'Updating...';
    await accountUpdateSettings('data', form).then(() => {
      document.querySelector('.btn--update').innerText = 'save password';
      formUserData.querySelector('.btn').disabled = true;
    });
  });
}

if (formUserPassword)
  formUserPassword.addEventListener('submit', async (e) => {
    e.preventDefault();

    document.querySelector('.btn--save').innerText = 'Updating...';
    document.querySelector('.btn--save').disabled = false;

    const passwordCurrent = document.getElementById('password-current').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('password-confirm').value;

    await accountUpdateSettings('password', {
      passwordCurrent,
      password,
      passwordConfirm
    }).then(() => {
      document.querySelector('.btn--save').innerText = 'save password';
      document.querySelector('.btn--save').disabled = true;

      document.getElementById('password-current').value = '';
      document.getElementById('password').value = '';
      document.getElementById('password-confirm').value = '';
    });
  });

if (bookBtn)
  bookBtn.addEventListener('click', (e) => {
    bookBtn.textContent = 'Processing...';

    const { tourId } = e.target.dataset;
    checkoutPayment(tourId);
  });

if (formReview) {
  formReview.addEventListener('submit', async (e) => {
    e.preventDefault();
    let data = {};

    // info: collecting data
    const review = document.getElementById('review-text');
    const rating = document.querySelector('input[name="rating"]:checked');
    const btnSend = formReview.querySelector('.btn__send');
    const btnCreateUpdate = formReview.querySelector('.btn-cu');

    // info: testing input data
    if (!review || !rating)
      return showAlert('error', 'Select rating please, then try again.');

    const { tourId } = btnCreateUpdate.dataset;
    data.review = review.value;
    data.rating = rating.value;

    btnSend.textContent = 'Sending...';
    // info: create new review
    await createUpdateReview('create', data, tourId);
    document
      .querySelectorAll('input[name="rating"]:checked')
      .forEach((radio) => (radio.checked = false));
    review.value = '';
    btnSend.textContent = 'Send';
  });
}

if (userPhoto) {
  userPhoto.addEventListener('click', () => {
    userPhoto.classList.toggle('active');
  });
}

if (saveBtns) {
  // info: retrieved the saved array if there are any
  const favTours = JSON.parse(localStorage.getItem('favoriteTours')) || [];
  saveBtns.forEach((saveBtn) => {
    // info: applying as 'favorite' on those tours who are suppose to be
    if (favTours.includes(saveBtn.getAttribute('data-tour-id'))) {
      saveBtn.checked = true;
    }

    saveBtn.addEventListener('click', (e) => {
      // note: localStorage.removeItem("theme");
      // note: localStorage.setItem("fontSize", "16px");
      // note: localStorage.getItem("fontSize");
      const { tourId } = e.target.dataset;
      if (favTours.includes(tourId)) {
        favTours.splice(favTours.indexOf(tourId), 1);
      } else {
        favTours.push(tourId);
      }
      localStorage.setItem('favoriteTours', JSON.stringify(favTours));
    });
  });
}

if (alertBodyMessage) {
  showAlert('success', alertBodyMessage, 20);
}
