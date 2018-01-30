let previousTarget;

function SVGTabToggle() {
  const root = document.querySelector('[data-component="svg-tab-toggle"]');

  const tabLinks = root.querySelectorAll("svg > a");

  tabLinks.forEach(link => {
    // remove existing
    link.removeEventListener("click", onclick);

    // add new
    link.addEventListener("click", onclick);
  });
}

function onclick(evt) {
  const { currentTarget: target } = evt;

  if (previousTarget) {
    previousTarget.classList.remove("active");
  }

  console.log(target);

  target.classList.add("active");
  previousTarget = target;
}

export default SVGTabToggle;
