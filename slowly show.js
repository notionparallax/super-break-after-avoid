let elements = [];
document
  .getElementById("page-3")
  .querySelectorAll("*")
  .forEach((el) => {
    if (el.dataset.elementNumber) {
      el.style.display = "none";
      elements.push(el);
    }
  });

// elements.sort((x, y) => {
//   x = x.dataset.elementNumber;
//   y = y.dataset.elementNumber;
//   if (x < y) {
//     return -1;
//   }
//   if (x > y) {
//     return 1;
//   }
//   return 0;
// });

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function reshow() {
  for (let i = 0; i < elements.length; i++) {
    let e = elements[i];
    await sleep(800);
    console.log(e.dataset.elementNumber);
    e.style.removeProperty("display");
  }
}

reshow();
