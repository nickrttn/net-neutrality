export default function SVGOverlay() {
  const root = document.querySelector('[data-component="svg-overlay"]');

  const svg = root.querySelector('.svg');
  const baseImg = root.querySelector('.base');

  baseImg.removeEventListener('click', onclick);
  baseImg.addEventListener('click', onclick);

  function onclick() {
    svg.classList.toggle('show');
  }
}