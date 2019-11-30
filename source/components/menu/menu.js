const menu = document.querySelector('.navigation__wrapper');
const button = document.querySelector('.menu');

button.addEventListener('click', () => {
    button.classList.toggle('menu--active');
    menu.classList.toggle('navigation__wrapper--active');
});
