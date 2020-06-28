# Decapitated headings!

I'm Ben and I make a zine called [Walden Pond](https://waldenpond.press). I'm using [Paged.js](https://www.pagedjs.org/) to lay out text that I'm pulling from the Pocket api into a monthly magazine. Browsers are optimised pretty heavily for screens, [Paged.js](https://www.pagedjs.org/) has been incredibly helpful in solving a lot of the issues that come from trying to lay out pages nicely, but there's always a _bit more_ to do.

I've had lots of arguments with friends about the merits of Latex vs browser rendering. I feel that Latex is probably still the better place to render text, but browsers are catching up fast, and if content can live in one place, and be consumed in many, then the holy trinity of html/css/js is the logical place to put our efforts.

One of the things that browsers seem to particularly struggle with is laying things out in discrete chunks like pages or columns, and especially columns on pages! [Paged.js][1] seems to be making a lot of progress in polyfilling those issues (e.g. [page floats](https://www.pagedjs.org/page-floats/)), and this is another one of those sorts of issues.

Headings are there to head something. They live to be attached to bodies, and without them they're very sad. Consider the pages below, there's a heading at the bottom of the page, what is it heading?

![diagram of a bad page, and the two pages that it would ideally be transformed into](https://i.stack.imgur.com/E4plw.png)

Is it fancy graphic design? Or is it adrift and unable to find meaning in this world?

The pattern matching part of our brains likes to infer meaning from what we see. It relies on [gestalt principles](https://www.toptal.com/designers/ui/gestalt-principles-of-design) to be able to operate. There are the big ticket ideas:

<figure>

![](https://bs-uploads.toptal.io/blackfish-uploads/blog/article/content/cover_image_file/cover_image/15308/cover-gestalt-principles-of-design-45cb1b7e7cada357ab317284e9a79a77.png)

<figcaption>

This illustration comes in many versions, and I couldn't find an attributed one. This particular one is from the <cite>[Toptal Design blog](https://www.toptal.com/designers/ui/gestalt-principles-of-design)</cite>.

</figcaption>
</figure>

...but also some that are more obviously socially constructed. One of them is that the big writing says something about paragraph that comes after it. If a heading has nothing after it, it's a jarring break of the social contract we have with our books.

## Enough of the faffing, what's the problem?

The pages in Walden Pond have a 2 column layout. Article headings span both columns and h1&ndash;5 are within the column. Here's an example of a page behaving pretty nicely.

![an example of page that has laid out well](https://gitlab.pagedmedia.org/tools/pagedjs/uploads/715689f6170d2032a0372337a275f59a/a-nice-page.png)

It's easier to explain things with diagrams, here are two pages with acceptable layouts:

![Diagram of two acceptable pages](https://i.stack.imgur.com/viJXw.png)

They've both got article headings and sub headings in good places. I.e. not at the bottom of a column. If there's a situation where a heading is at the bottom of a column, We'd like the heading to be forced to the top of next column.

![Diagram of a heading being bumped to the next column](https://i.stack.imgur.com/nK0gK.png)

That seems pretty simple. Indesign has a concept of [keep options](https://indesignsecrets.com/keep-options-interact.php) which tries to keep headings with the paragraph after them. [Latex has](https://tex.stackexchange.com/questions/32111/how-to-keep-heading-together-with-text) the [needspace](https://ctan.org/pkg/needspace) package/concept which seems to do the same.

You can more or less do this in css with a combination of `break-after: avoid` and `orphans`

[Julie Blanc](https://twitter.com/julieblancfr) has [pointed out](https://mattermost.pagedmedia.org/pagedmedia/pl/jqouro7or3yzpyux16uas9bpuw) that you can more or less do this in css with a combination of an [adjacent sibling combinator](https://developer.mozilla.org/en-US/docs/Web/CSS/Adjacent_sibling_combinator), `break-after: avoid;` and `orphans`:

```
h1 {
    break-before: avoid;
}
h1 + p {
     orphans: 8;
}
```

- **TODO: check this, I think it should be break-after, and it should be inside the `h1 + p`**

  i.e.

  ```css
  h1 + p,
  h2 + p,
  h3 + p,
  h4 + p,
  h5 + p {
    background-color: hotpink;
    break-before: avoid;
    orphans: 4;
  }
  ```

  except this doesn't work (╯°□°）╯︵ ┻━┻)

We might want to have a bit more control over these things though. Walden Pond articles often start with an image, so if the bottom of the heading is too close to the bottom of the page, it will bump the image to the next page, and there's a lonely heading in the middle of the page, just sitting there looking silly. So if a new article starts in the bottom 40% of the page, I'd like that to be forced to the next page too.

<figure>

![](https://gitlab.pagedmedia.org/tools/pagedjs/uploads/3aac59c923e438680fe6e0d0df994337/Artboard_6.png)

<figcaption>

The heading on the left page is all good, it's only one line, but if we start a really long heading, e.g. "[Inspiring! This Runner Stopped Just Yards From The Finish To Put A Collapsed Rival Out Of Her Misery](https://clickhole.com/inspiring-this-runner-stopped-just-yards-from-the-fini-1825122339/)", then there wouldn't be enough space to squeeze in a sensible looking block of body text. Thinking about the _bottom_ of the header will come up later.

</figcaption>

</figure>
There are other times that this might be an issue too. It's not only the bottom of the page that matters here, but the bottom of any container that has columns.

<figure>

![](https://gitlab.pagedmedia.org/tools/pagedjs/uploads/f748289f5a37d5a3b16ad61ce713a435/Artboard_7.png)![break-at-the-bottom-of-a-column](https://gitlab.pagedmedia.org/tools/pagedjs/uploads/b094054da315368d72cf711e2fe32abd/break-at-the-bottom-of-a-column.png)

<figcaption>
If this heading ends up at the bottom of the column _my_ brain assumes that it's actually related to the article below. (Ignore the green line, I'm sure I had a good reason when I drew that in the first place ¯\_(ツ)_/¯)
</figcaption>
</figure>

## So how do we solve this problem?

I tried all sorts of ways of solving this, all had their own way of failing. Again [Julie Blanc](https://twitter.com/julieblancfr) came to my rescue. It turns out that I was trying to control the layout at the wrong point in the layout's lifecycle.

I was trying to do the work in `afterPageLayout` but I _should_ have been doing it in `renderNode`. As far as I can tell, `renderNode` put the element on the page, and then gives you a chance to change it. Then it re-renders it. (I'd love a description/diagram of how the Paged lifecycle works!)

Julie's solution is elegant. Look at the header, if it's in a bad place (however you define that) put in a pad that moves it out of the way and then re-render it in a new, safe, spot.

<figure>

![Diagram of a page with opportunities to shim marked](https://i.stack.imgur.com/O67Wv.png)
![Screenshot of a real page with a shim that bumps a heading to the next page](https://i.stack.imgur.com/GApAm.png)

<figcaption>

In this image, there's no need to put in a pad above the first heading, so we don't, but the second heading is in a bad place, so we bump it. The pad gets the same `column-span` as the heading that it's padding/bumping.

The right hand image shows an outlined div that's pushing a heading off the bottom of a column onto the next page.

</figcaption>

</figure>

## Talk is cheap, show me the code!

## Cool, so that's it then?

Oh, if only!

There's always a _however_. There's always some interesting edge cases that don't get bumped to the next column, or things that get bumped in the middle of a column, and I think I've figured out what's causing it.

The default [column filling behaviour](https://developer.mozilla.org/en-US/docs/Web/CSS/column-fill) in Chrome and Firefox is `balance`. This means that it tries to make the bottom of the set of columns look nice by moving the content around once it's rendered. Using `renderNode`, the node is in one place, but by the time we see it, it's in another spot.

If you set the column filling behaviour to auto, then it fills the first column, then the next. If you think of the columns as being full of water, then `auto` gives you solid walls between columns, and `balance` gives you porous walls.

![pouring_water_](https://gitlab.pagedmedia.org/tools/pagedjs/uploads/0998940f65b45047d86f073f8be34f44/pouring_water_.png)

We could just set the column balancing to `auto` and live with the balancing mismatch when it comes up, but MDN sayeth:

> Note that there are some interoperability issues and bugs with column-fill across browsers, due to unresolved issues in the specification.
>
> In particular, when using column-fill: auto to fill columns sequentially, Chrome will only consult this property if the multicol container has a size in the block dimension (e.g. height in a horizontal writing mode). Firefox will always consult this property, therefore filling the first column with all of the content in cases where there is no size.

Which plays out as expected here in FF:

![firefox_co-fills](https://gitlab.pagedmedia.org/tools/pagedjs/uploads/abf4e5651feb85b7859c3525c755b10b/firefox_co-fills.png)

But in Chrome the heading bump isn't triggered because the `article` doesn't have a height. If I set a height it does actually work! (I really expected it to mess with the paged pagination because the article was less than a page high.)

![sad_auto_column](https://gitlab.pagedmedia.org/tools/pagedjs/uploads/3878c201c6cf35114210ca15d0278c43/sad_auto_column.png)

The layout behind is using `column-fill: auto;` and the one in front is `column-fill: balance;`. The front one doesn't have anything on the rest of the page because we've had to set an explicit height for the article container. This means that a lot of this is a bit redundant because articles are always going to start on a new page.

The way I have been debugging this is by adding a dataset value to the heading as it's passed through the `renderNode` function.

![a_vs_b_filling_](https://gitlab.pagedmedia.org/tools/pagedjs/uploads/52599b0903100ecd49b235993347d4ec/a_vs_b_filling_.png)

It's worth spending a bit of time on these two pages. The left page works as we'd expect it to, but the one on the right hasn't padded the heading that shows up at the bottom of the first column. The percentages on the badges give us a clue as to why this is. It's showing up as 48%, which is too high on the page to trigger a bump-shim. I _think_ that this is caused by column rebalancing as the page is filled.

<figure>

![auto filling](https://media.giphy.com/media/eHj3ExzTPJcoVMvvyM/giphy.gif) ![balance filling](https://media.giphy.com/media/PmpxIYqrNDJ7NhSlkt/giphy.gif)

<figcaption>

This is fake loading elements into the page. I _assume_ that this is how it's happening from the perspective of the `renderNode` function. In the left gif, `auto` the column is filled until it's full, then elements move into the next one. In the right gif, `balance` the columns are re-balanced after each element is added. So when the elements are rendered, they aren't in the same position that they'll finish in.

<figcaption>
</figure>

I've found another thing that can cause poor positioning. If an image takes a while to load then its height is 0, so the heading that comes after it thinks that it's got plenty of space.

![image_rendering_delay](https://gitlab.pagedmedia.org/tools/pagedjs/uploads/6d14194c6d15ee951098571cef8db93a/image_rendering_delay.png)

I think that this could be handled by loading each image in a promise, but I'm not really a promise wizard yet. 🧙‍♂️
