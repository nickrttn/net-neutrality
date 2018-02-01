let previousTarget = document.querySelector('a[href="#data-control"]');
let firstTab;

function SVGTabToggle() {
  const root = document.querySelector('[data-component="svg-tab-toggle"]');

  const tabLinks = root.querySelectorAll("svg > a");

  firstTab = root.querySelector('li.active');

  tabLinks.forEach(link => {
    // remove existing
    link.removeEventListener("click", onclick);

    // add new
    link.addEventListener("click", onclick);
  });
}

function onclick(evt) {
  const { currentTarget: target } = evt;

  if (firstTab) {
    firstTab.classList.remove('active');
    firstTab = null;
  }

  if (previousTarget) {
    previousTarget.classList.remove("active");
  }

  target.classList.add("active");
  previousTarget = target;
}

export default SVGTabToggle;
