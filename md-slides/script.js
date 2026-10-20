// markdown slides app

var storageKey = "mySlidesMd";

var defaultText = "# Welcome\n## My first slide\nThis is some content\n\n---\n\n# Slide 2\n## Heading 2\n- point one\n- point two\n- point three\n\n---\n\n# Slide 3\n## Thank you\nThis is the **last** slide";

var slides = [];
var current = 0;
var screenName = "home";   // home, editor, presenter

// getting elements
var home = document.getElementById("home");
var editor = document.getElementById("editor");
var presenter = document.getElementById("presenter");
var mdText = document.getElementById("mdText");
var msg = document.getElementById("msg");
var info = document.getElementById("info");
var previewBox = document.getElementById("previewBox");

// ---------- markdown to html ----------

function escapeHtml(t) {
  return t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// bold, italic, code, links, images
function inline(t) {
  t = escapeHtml(t);
  t = t.replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1">');
  t = t.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>');
  t = t.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");
  t = t.replace(/\*(.+?)\*/g, "<i>$1</i>");
  t = t.replace(/`(.+?)`/g, "<code>$1</code>");
  return t;
}

function mdToHtml(md) {
  var lines = md.split("\n");
  var html = "";
  var listType = "";   // ul or ol
  var inCode = false;

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];

    // code block
    if (line.trim().indexOf("```") == 0) {
      if (inCode == false) {
        if (listType != "") { html += "</" + listType + ">"; listType = ""; }
        html += "<pre><code>";
        inCode = true;
      } else {
        html += "</code></pre>";
        inCode = false;
      }
      continue;
    }
    if (inCode) {
      html += escapeHtml(line) + "\n";
      continue;
    }

    var ul = line.match(/^\s*[-*+] (.*)/);
    var ol = line.match(/^\s*\d+\. (.*)/);

    if (ul) {
      if (listType != "ul") {
        if (listType != "") html += "</" + listType + ">";
        html += "<ul>";
        listType = "ul";
      }
      html += "<li>" + inline(ul[1]) + "</li>";
      continue;
    }
    if (ol) {
      if (listType != "ol") {
        if (listType != "") html += "</" + listType + ">";
        html += "<ol>";
        listType = "ol";
      }
      html += "<li>" + inline(ol[1]) + "</li>";
      continue;
    }

    // not a list line so close the list
    if (listType != "") {
      html += "</" + listType + ">";
      listType = "";
    }

    var h = line.match(/^(#{1,6}) (.*)/);
    if (h) {
      var n = h[1].length;
      html += "<h" + n + ">" + inline(h[2]) + "</h" + n + ">";
    } else if (line.indexOf(">") == 0) {
      html += "<blockquote>" + inline(line.substring(1).trim()) + "</blockquote>";
    } else if (line.trim() == "") {
      // empty line, do nothing
    } else {
      html += "<p>" + inline(line) + "</p>";
    }
  }

  if (listType != "") html += "</" + listType + ">";
  if (inCode) html += "</code></pre>";
  return html;
}

// ---------- slides ----------

// split the md file by ---
function getSlides(text) {
  var parts = text.split(/^\s*---\s*$/m);
  var result = [];
  for (var i = 0; i < parts.length; i++) {
    if (parts[i].trim() != "") {
      result.push(parts[i]);
    }
  }
  if (result.length == 0) result.push("");
  return result;
}

// shows the current slide in the screen we are on
function showSlide() {
  var slideDiv, prev, next, count;

  if (screenName == "editor") {
    slides = getSlides(mdText.value);
    slideDiv = document.getElementById("previewSlide");
    prev = document.getElementById("prevBtn");
    next = document.getElementById("nextBtn");
    count = document.getElementById("count");
  } else {
    slideDiv = document.getElementById("pSlide");
    prev = document.getElementById("pPrev");
    next = document.getElementById("pNext");
    count = document.getElementById("pCount");
  }

  // if slides got deleted
  if (current > slides.length - 1) current = slides.length - 1;
  if (current < 0) current = 0;

  slideDiv.innerHTML = mdToHtml(slides[current]);
  count.innerHTML = (current + 1) + " / " + slides.length;

  prev.disabled = (current == 0);
  next.disabled = (current == slides.length - 1);
}

function goLeft() {
  if (current > 0) {
    current--;
    showSlide();
  }
}

function goRight() {
  if (current < slides.length - 1) {
    current++;
    showSlide();
  }
}

// ---------- fullscreen ----------

function toggleFullScreen() {
  if (document.fullscreenElement) {
    document.exitFullscreen();
  } else {
    if (screenName == "editor") {
      previewBox.requestFullscreen();
    } else if (screenName == "presenter") {
      presenter.requestFullscreen();
    }
  }
}

// change button text
document.addEventListener("fullscreenchange", function () {
  var text = "Full Screen";
  if (document.fullscreenElement) {
    text = "Exit Full Screen";
  }
  var btns = document.getElementsByClassName("fsBtn");
  for (var i = 0; i < btns.length; i++) {
    btns[i].innerHTML = text;
  }
});

// ---------- save / load ----------

function saveSlides() {
  localStorage.setItem(storageKey, mdText.value);
  msg.innerHTML = "Saved!";
  setTimeout(function () { msg.innerHTML = ""; }, 2000);
}

function checkSaved() {
  var saved = localStorage.getItem(storageKey);
  if (saved == null) {
    info.innerHTML = "No saved slides yet";
  } else {
    info.innerHTML = "Saved slides found in browser (" + getSlides(saved).length + " slides)";
  }
}

// ---------- changing screens ----------

function openScreen(name) {
  home.classList.add("hidden");
  editor.classList.add("hidden");
  presenter.classList.add("hidden");
  screenName = name;
  current = 0;

  if (name == "home") {
    home.classList.remove("hidden");
    checkSaved();
  } else if (name == "editor") {
    editor.classList.remove("hidden");
    showSlide();
  } else {
    presenter.classList.remove("hidden");
    showSlide();
  }
}

// ---------- buttons ----------

document.getElementById("createBtn").onclick = function () {
  mdText.value = defaultText;
  openScreen("editor");
};

document.getElementById("editBtn").onclick = function () {
  var saved = localStorage.getItem(storageKey);
  if (saved == null) {
    alert("No saved slides found, create one first");
    return;
  }
  mdText.value = saved;
  openScreen("editor");
};

document.getElementById("presentBtn").onclick = function () {
  var saved = localStorage.getItem(storageKey);
  if (saved == null) {
    alert("No saved slides found, create one first");
    return;
  }
  slides = getSlides(saved);
  openScreen("presenter");
};

document.getElementById("backBtn").onclick = function () {
  if (document.fullscreenElement) document.exitFullscreen();
  openScreen("home");
};

document.getElementById("pExit").onclick = function () {
  if (document.fullscreenElement) document.exitFullscreen();
  openScreen("home");
};

document.getElementById("saveBtn").onclick = saveSlides;

// left right fullscreen buttons (editor)
document.getElementById("prevBtn").onclick = goLeft;
document.getElementById("nextBtn").onclick = goRight;
document.getElementById("fsBtn").onclick = toggleFullScreen;

// left right fullscreen buttons (presenter)
document.getElementById("pPrev").onclick = goLeft;
document.getElementById("pNext").onclick = goRight;
document.getElementById("pFs").onclick = toggleFullScreen;

// realtime preview when typing
mdText.oninput = function () {
  showSlide();
};

// ---------- keyboard ----------

document.addEventListener("keydown", function (e) {
  if (screenName == "home") return;

  // ctrl + s
  if (e.ctrlKey && (e.key == "s" || e.key == "S")) {
    e.preventDefault();
    if (screenName == "editor") {
      saveSlides();
    }
    return;
  }

  // f11
  if (e.key == "F11") {
    e.preventDefault();
    toggleFullScreen();
    return;
  }

  // arrow keys, dont use them if user is typing in the textarea
  if (document.activeElement == mdText) return;

  if (e.key == "ArrowRight") {
    goRight();
  }
  if (e.key == "ArrowLeft") {
    goLeft();
  }
});

// start
openScreen("home");
