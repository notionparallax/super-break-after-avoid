// window.PagedConfig = { auto: false };
const pageCountMultiple = 12;

const titles = "h1, h2, h3, h4, h5";

class MyHandler extends Paged.Handler {
  constructor(chunker, polisher, caller) {
    super(chunker, polisher, caller);
  }

  beforeParsed(content) {
    console.log("in beforeParsed"); //, content);
    removeThingsThatUpsetPagedJS(content);
  }

  afterParsed(parsed) {
    // console.log("in afterParsed"); //, parsed);
  }

  beforePageLayout(page) {
    // console.log("in beforePageLayout"); //, page);
  }

  renderNode(node) {
    handleNoderendering(node);
  }

  afterPageLayout(pageFragment, page, breakToken) {
    // console.log("in afterPageLayout"); //, pageFragment, page, breakToken);
  }

  afterRendered(pages) {
    console.log("in afterRendered"); //, pages);
    document.querySelector("body").classList = "";
  }
}
Paged.registerHandlers(MyHandler);

async function handleNoderendering(node) {
  if (
    node &&
    node.nodeType == Node.ELEMENT_NODE &&
    node.matches("h1.article-title, h1, h2, h3, h4, h5")
  ) {
    // bumpElementToNextPageOrColumn(node);
    const nodeBottom = node.getBoundingClientRect().bottom;
    const nodeTop = node.getBoundingClientRect().top;
    const nodeHeight = node.getBoundingClientRect().height;
    let distBottom = { h1: 0.45, h2: 0.15, h3: 0.12, h4: 0.05, h5: 0.05 }[
      node.tagName.toLowerCase()
    ]; // distance (%) of the bottom of the page
    // find the overflow line -------------------------------------------------
    const pageContent = node.closest(".pagedjs_page_content");
    const pageContentHeight = pageContent.offsetHeight;
    // in the following code line, 40% from the bottom, so 60% from the top
    const lineOverflow = (1 - distBottom) * pageContentHeight;
    // distance of the bottom node from the top of content area ---------------
    const pageContentTop = pageContent.getBoundingClientRect().top;
    const dist = nodeBottom - pageContentTop;
    node.dataset.percentagePosition = `☜ ${Math.round(
      100 - (dist / pageContentHeight) * 100
    )}%`;
    // add element to push the title next page / column ----------------------------
    if (dist > lineOverflow) {
      if (Math.abs(nodeTop - pageContentTop) < 10) {
        console.log(node, "is massive, freak out");
        node.classList.add("mega-wordy-title");
      } else {
        console.log("in renderNode", "bumping", node);
        const shimDiv = document.createElement("div");
        const shimHeight = nodeHeight + pageContentHeight - dist;
        shimDiv.style.setProperty("--remaining-distance", shimHeight + "px");
        const heightVal = " var(--remaining-distance)";
        shimDiv.style.height = heightVal;
        shimDiv.classList.add("shim-div");
        shimDiv.style.columnSpan = window.getComputedStyle(node).columnSpan;
        node.parentNode.insertBefore(shimDiv, node);
      }
    }
  }
  return node;
}

function removeThingsThatUpsetPagedJS(content) {
  content.querySelectorAll("*").forEach((el) => {
    el.removeAttribute("data-page");
    el.removeAttribute("nodeindex");
  });
}
