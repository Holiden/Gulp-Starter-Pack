const page = document.querySelector('.main-page');
const navigationMenuButton = document.querySelector('.menu');
const navigationMenu = document.querySelector('.navigation');

(function () {

  const isMenuHiddenCheck = () => {
    let attributeValueExpanded = navigationMenuButton.getAttribute('aria-expanded');

    return attributeValueExpanded === 'true';
  };

  const handleNavigationMenuState = () => {
    const isMenuHidden = isMenuHiddenCheck();
    navigationMenuButton.setAttribute('aria-expanded', !isMenuHidden);

    if (isMenuHidden) {
      navigationMenuButton.setAttribute('aria-label', 'Открыть меню');
    } else {
      navigationMenuButton.setAttribute('aria-label', 'Закрыть меню');
    }
  };

  const toggleNavigationMenu = () => {
    page.classList.toggle('active');
    navigationMenuButton.classList.toggle('active');
    navigationMenu.classList.toggle('active');
  };

  navigationMenuButton.addEventListener('click', () => {
    handleNavigationMenuState();
    toggleNavigationMenu();
  });
}());
