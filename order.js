// order.js - with animations, plate badge, curious emoji, fireworks & wave sequence
document.addEventListener("DOMContentLoaded", () => {
  /* -------------------------
     Configuration & state
     ------------------------- */
  const EXTRA_PRICE = 50; // Rs 50 for raita / salad
  const plateItems = [];

  const BURGER_PRICE_MAP = {
    shami: { round: 270, long: 300 },
    cutlets: { round: 260, long: 290 },
    egg: { round: 180, long: 210 }
  };

  const SANDWICH_PRICE_MAP = {
    shami: { "2": 180, "3": 250, "4": 330 },
    cutlets: { "2": 170, "3": 240, "4": 320 },
    egg: { "2": 180, "3": 200, "4": 230 }
  };

  /* -------------------------
     Small DOM helpers
     ------------------------- */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  function createQtyControl(initial = 0) {
    const wrapper = document.createElement("div");
    wrapper.className = "qty-control";

    const minus = document.createElement("button");
    minus.type = "button";
    minus.textContent = "-";

    const display = document.createElement("div");
    display.className = "qty-display";
    let qty = Math.max(0, Math.floor(initial));
    display.dataset.qty = String(qty);
    display.textContent = qty > 0 ? String(qty) : "How much";
    if (qty === 0) display.classList.add("qty-placeholder");

    const plus = document.createElement("button");
    plus.type = "button";
    plus.textContent = "+";

    wrapper.append(minus, display, plus);

    function updateDisplay() {
      display.dataset.qty = String(qty);
      if (qty === 0) {
        display.textContent = "How much";
        display.classList.add("qty-placeholder");
      } else {
        display.textContent = String(qty);
        display.classList.remove("qty-placeholder");
      }
      wrapper.dispatchEvent(new CustomEvent("qtychange", { detail: qty }));
    }

    minus.addEventListener("click", () => {
      if (qty === 0) return;
      qty--;
      updateDisplay();
    });

    plus.addEventListener("click", () => {
      if (qty === 0) qty = 1;
      else qty++;
      updateDisplay();
    });

    wrapper.getQty = () => qty;
    wrapper.setQty = (v) => { qty = Math.max(0, Math.floor(v || 0)); updateDisplay(); };

    return wrapper;
  }

  function calcTotal() {
    let total = 0;
    plateItems.forEach(it => {
      if (it.included === false) return;
      it.parts.forEach(p => total += p.price * p.qty);
      if (it.extras) it.extras.forEach(e => total += e.price * e.qty);
    });
    return total;
  }

  function updateTotals() {
    $("#total").textContent = calcTotal();
    updatePlateBadge();
  }

  

  /* -------------------------
     UI refs
     ------------------------- */
  const myPlateBtn = $("#myPlateBtn");
  const platePanel = $("#platePanel");
  const plateList = $("#plateList");
  const finalOrderBtn = $("#finalOrder");
  const closePlateBtn = $("#closePlate");


  // --- Insert this INSIDE order.js's DOMContentLoaded closure, after createQtyControl, renderPlateList and updateTotals are defined ---
/* Expose a small API for external modules (tea/ketchup) */
window.ORDER_API = window.ORDER_API || {};

window.ORDER_API.createQtyControl = createQtyControl;
window.ORDER_API.updateTotals = () => updateTotals();
window.ORDER_API.renderPlateList = () => renderPlateList();
window.ORDER_API.addItemProgrammatic = function(newItem) {
  // newItem shape: { name: string, parts: [ {label, price, qty} ], extras: [ {label, price, qty} ], included:true }
  try {
    // plateItems exists in order.js closure; expose a function that pushes to it
    // If plateItems is not accessible here (because of scope), make sure this snippet is placed where plateItems is defined.
    plateItems.push(newItem);
    renderPlateList();
    updateTotals();
    // small notification (existing helper)
    if (typeof showPlateNotification === "function") showPlateNotification();
  } catch (err) {
    console.error("addItemProgrammatic failed:", err);
  }
};


  /* -------------------------
     UI/Animation helpers
     ------------------------- */
function showPlateNotification() {
  // ensure parent is positioned so absolute child works
  const parent = document.getElementById("myPlateBtn");
  if (getComputedStyle(parent).position === "static") parent.style.position = "relative";

  const note = document.createElement("div");
  note.className = "plate-note plate-pop";
  // Use any emoji or small HTML here. Examples:
  // note.innerHTML = "🍽️";           // single emoji
  // note.innerHTML = "✨ Added";     // emoji + label
  // note.innerHTML = "<span class='pop-emoji'>✨</span>"; // custom span
  note.innerHTML = "✨"; // minimal sparkle emoji pop

  parent.appendChild(note);

  // Remove after duration defined in CSS (we'll default to 2200ms)
  const removeAfter = 2200;
  setTimeout(() => {
    // fade out then remove
    note.classList.add("fade-away");
    setTimeout(() => note.remove(), 600);
  }, removeAfter);
}
  function showSadEmoji() {
    const sad = document.createElement("div");
    sad.className = "sad-emoji";
    sad.innerText = "😢💔";
    myPlateBtn.appendChild(sad);
    setTimeout(() => sad.remove(), 1000);
  }

  // sprinkle/sparkle effect; positions near the Add button and removes after animation
  function sparkleEffect(button) {
    const sparkle = document.createElement("div");
    sparkle.className = "sparkle";
    // position relative to button
    const rect = button.getBoundingClientRect();
    sparkle.style.left = `${rect.width - 24}px`;
    sparkle.style.top = `-12px`;
    sparkle.style.position = 'absolute';
    sparkle.style.pointerEvents = 'none';
    sparkle.innerText = "😢💔";
    // ensure the button is positioned relatively so absolute child positions properly
    button.style.position = button.style.position || 'relative';
    button.appendChild(sparkle);
    setTimeout(() => sparkle.remove(), 1100);
  }

  // Plate badge: visible when plate has items (stays until final success)
  function updatePlateBadge() {
    let badge = myPlateBtn.querySelector(".plate-badge");
    const has = plateItems.length > 0;
    if (has && !badge) {
      badge = document.createElement("div");
      badge.className = "plate-badge";
      badge.innerText = plateItems.length;
      myPlateBtn.appendChild(badge);
    } else if (badge) {
      if (has) badge.innerText = plateItems.length;
      else badge.remove();
    }
  }

  // show final completion UI (fireworks + thank you) and reset plate
  let finalSuccessShown = false;
  function showFinalSuccess() {
    if (finalSuccessShown) return;
    finalSuccessShown = true;

    // show fireworks overlay
    const fw = document.createElement("div");
    fw.className = "fireworks-overlay";
    fw.innerHTML = `<div class="fireworks-bg"></div>
                    <div class="thank-panel"><h2>Thank you for ordering from LOG FROZE!</h2></div>`;
    document.body.appendChild(fw);

    // clear plate data & UI
    plateItems.length = 0;
    renderPlateList();
    updateTotals();

    // remove overlay after a few seconds
    setTimeout(() => {
      fw.classList.add("fadeout");
      setTimeout(() => fw.remove(), 1000);
    }, 3000);

    // reset finalSuccessShown after a short while so next order can show again
    setTimeout(() => { finalSuccessShown = false; }, 4000);
  }

  // Wave / cascading animation across card elements
  function playWaveAnimation(card) {
    // collect sequence: item-btn, item-body, option rows, bun rows, qty rows, section-extras
    const seq = [];
    const btn = $(".item-btn", card);
    if (btn) seq.push(btn);
    const body = $(".item-body", card);
    if (body) seq.push(body);

    // add top-level rows inside body in the natural order
    const rows = Array.from(body ? body.querySelectorAll(".option-row, .patty-row, .slice-selector, .bun-options, .qty-list, .section-extras, .combo-section, .post-combo-extras") : []);
    // flatten qty-list children into sequence (each .option-row inside .qty-list)
    rows.forEach(r => {
      // if this is qty-list, insert its child rows
      if (r.classList.contains("qty-list") || r.classList.contains("bun-options")) {
        const inner = Array.from(r.querySelectorAll(".option-row, .patty-row"));
        inner.forEach(i => seq.push(i));
      } else {
        seq.push(r);
      }
    });

    // apply animated class in cascade
    seq.forEach((el, i) => {
      el.classList.remove("wave-step");
      // stagger timing
      setTimeout(() => {
        el.classList.add("wave-step");
        // remove after animation is done so it can play again later
        setTimeout(() => el.classList.remove("wave-step"), 900);
      }, i * 110);
    });
  }

  /* -------------------------
     Plate panel behavior
     ------------------------- */
  myPlateBtn.addEventListener("click", () => {
    platePanel.classList.toggle("hidden");
    platePanel.setAttribute("aria-hidden", platePanel.classList.contains("hidden") ? "true" : "false");
  });

  closePlateBtn.addEventListener("click", () => {
    platePanel.classList.add("hidden");
    platePanel.setAttribute("aria-hidden", "true");
  });

  finalOrderBtn.addEventListener("click", () => {
    if (plateItems.length === 0) {
      alert("Your plate is empty. Add items first.");
      return;
    }
    platePanel.classList.add("hidden");
    platePanel.setAttribute("aria-hidden", "true");
    document.getElementById("finalOrderModal").classList.remove("hidden");

    // curious emoji: create once and keep until form submit
    if (!document.querySelector(".curious-emoji")) {
      const curious = document.createElement("div");
      curious.className = "curious-emoji";
      curious.innerText = "";
      document.getElementById("finalOrderModal").appendChild(curious);
    }
  });

  /* -------------------------
     Plate rendering
     ------------------------- */
  function renderPlateList() {
    plateList.innerHTML = "";
    plateItems.forEach((it, idx) => {
      const li = document.createElement("li");
      const chk = document.createElement("input");
      chk.type = "checkbox";
      chk.checked = it.included !== false;
      chk.addEventListener("change", () => {
        it.included = chk.checked;
        updateTotals();
      });

      const title = document.createElement("div");
      title.className = "plate-title";
      title.textContent = it.name;

      const details = document.createElement("div");
      details.className = "plate-details";
      it.parts.forEach(p => {
        const d = document.createElement("div");
        d.textContent = `${p.label} x${p.qty} (Rs ${p.price * p.qty})`;
        details.appendChild(d);
      });
      if (it.extras) it.extras.forEach(e => {
        const d = document.createElement("div");
        d.textContent = `+ ${e.label} x${e.qty} (Rs ${e.price * e.qty})`;
        details.appendChild(d);
      });

      const removeBtn = document.createElement("button");
      removeBtn.className = "remove-item";
      removeBtn.textContent = "Remove";
      removeBtn.addEventListener("click", () => {
        plateItems.splice(idx, 1);
        showSadEmoji();
        updateTotals();
        renderPlateList();
      });

      li.append(chk, title, details, removeBtn);
      plateList.appendChild(li);
    });
    updateTotals();
  }

  /* -------------------------
     Utility: any qty present on page
     ------------------------- */
  function anySectionHasQty() {
    const qcontrols = $$(".qty-control");
    return qcontrols.some(q => q.getQty ? q.getQty() > 0 : parseInt(q.dataset.qty || "0", 10) > 0);
  }

  /* -------------------------
     Per-card behavior
     ------------------------- */
  $$(".orderSection").forEach(section => {
    const card = section;
    const itemBtn = $(".item-btn", card);
    const body = $(".item-body", card);
    const options = $$(".option", card);
    const patties = $$(".patty", card);
    const fillings = $$(".filling", card);
    const bunOptionsArea = $(".bun-options", card);
    const qtyList = $(".qty-list", card);
    const addBtn = $(".add-plate", card);
    const sectionExtras = $(".section-extras", card);
    const comboSection = $(".combo-section", card);
    const postComboExtras = $(".post-combo-extras", card);
    const imageStack = $(".image-stack", card);

    if (imageStack) {
      imageStack.addEventListener("click", () => imageStack.classList.toggle("swap"));
    }

    // Play wave animation when user opens an item panel
    itemBtn.addEventListener("click", () => {
      body.classList.toggle("hidden");
      // play the wave sequence after a tiny delay so newly revealed elements are present
      setTimeout(() => playWaveAnimation(card), 80);
    });

    // Generic options -> create per-checked qty rows
    if (options.length) {
      options.forEach(opt => {
        opt.addEventListener("change", () => {
          qtyList.innerHTML = "";
          const checked = options.filter(o => o.checked);
          checked.forEach(o => {
            const row = document.createElement("div");
            row.className = "option-row";
            const label = document.createElement("div");
            label.textContent = `${o.dataset.type} (Rs ${o.dataset.price})`;
            const qctrl = createQtyControl(0);
            qctrl.addEventListener("qtychange", () => {
              if (anySectionHasQty()) {
                sectionExtras?.classList.remove("hidden");
                addBtn?.classList.remove("hidden");
              } else {
                sectionExtras?.classList.add("hidden");
                addBtn?.classList.add("hidden");
              }
              updateTotals();
            });
            row.append(label, qctrl);
            qtyList.appendChild(row);
          });

          if (checked.length === 0) {
            qtyList.classList.add("hidden");
            sectionExtras?.classList.add("hidden");
            addBtn?.classList.add("hidden");
          } else {
            qtyList.classList.remove("hidden");
          }
        });
      });
    }

    // Biryani combo: show combo once qty rows exist
    if (comboSection) {
      const observer = new MutationObserver(() => {
        const localQtys = $$(".qty-control", card);
        const hasQty = localQtys.some(q => q.getQty && q.getQty() > 0);
        if (hasQty) comboSection.classList.remove("hidden");
        else {
          comboSection.classList.add("hidden");
          postComboExtras?.classList.add("hidden");
          $$(".combo-section input[type='radio']", card).forEach(r => r.checked = false);
        }
      });
      observer.observe(qtyList, { childList: true, subtree: true });

      $$(".combo-section input[type='radio']", card).forEach(r => {
        r.addEventListener("change", () => {
          postComboExtras?.classList.remove("hidden");
        });
      });
    }

    // Rice extras: similar behavior to show extras only after qty > 0
    if (sectionExtras && section.dataset.item === "rice") {
      const observer = new MutationObserver(() => {
        const localQtys = $$(".qty-control", card);
        const hasQty = localQtys.some(q => q.getQty && q.getQty() > 0);
        if (hasQty) sectionExtras.classList.remove("hidden");
        else {
          sectionExtras.classList.add("hidden");
          $$(".section-extras input[type='radio']", card).forEach(r => r.checked = false);
        }
      });
      observer.observe(qtyList, { childList: true, subtree: true });
    }

    // Burger patties -> bun options + qty
    if (patties.length) {
      patties.forEach(p => p.addEventListener("change", () => {
        bunOptionsArea.innerHTML = "";
        const checked = patties.filter(pp => pp.checked);
        if (checked.length === 0) {
          bunOptionsArea.classList.add("hidden");
          qtyList.innerHTML = "";
          addBtn.classList.add("hidden");
          sectionExtras?.classList.add("hidden");
          return;
        }
        checked.forEach(pp => {
          const key = pp.dataset.key;
          const row = document.createElement("div");
          row.className = "patty-row";
          const label = document.createElement("div");
          label.textContent = `${pp.dataset.type}`;
          const bunSelect = document.createElement("select");
          bunSelect.innerHTML = `
            <option value="round" data-price="${BURGER_PRICE_MAP[key].round}">
              Round Bun – Rs ${BURGER_PRICE_MAP[key].round}
            </option>
            <option value="long" data-price="${BURGER_PRICE_MAP[key].long}">
              Long Bun – Rs ${BURGER_PRICE_MAP[key].long}
            </option>
          `;
          const qctrl = createQtyControl(0);
          qctrl.addEventListener("qtychange", () => {
            if (anySectionHasQty()) {
              sectionExtras?.classList.remove("hidden");
              addBtn?.classList.remove("hidden");
            } else {
              sectionExtras?.classList.add("hidden");
              addBtn?.classList.add("hidden");
            }
            updateTotals();
          });
          row.append(label, bunSelect, qctrl);
          bunOptionsArea.appendChild(row);
        });
        bunOptionsArea.classList.remove("hidden");
      }));
    }

    // Sandwich filling logic
    if (fillings.length) {
      fillings.forEach(f => f.addEventListener("change", () => {
        const checked = fillings.filter(ff => ff.checked);
        qtyList.innerHTML = "";
        if (checked.length === 0) {
          addBtn.classList.add("hidden");
          sectionExtras?.classList.add("hidden");
          return;
        }
        checked.forEach(ff => {
          const row = document.createElement("div");
          row.className = "option-row";
          const label = document.createElement("div");
          label.textContent = `${ff.dataset.type} - 3 slices`;
          const sliceSelect = document.createElement("select");
          ["2","3","4"].forEach(val => {
            const opt = document.createElement("option");
            opt.value = val;
            const key = ff.dataset.key || ff.dataset.type.toLowerCase();
            const price = SANDWICH_PRICE_MAP[key][val];
            opt.textContent = `${val} slices – Rs ${price}`;
            sliceSelect.appendChild(opt);
          });
          sliceSelect.value = "3";
          sliceSelect.addEventListener("change", () => {
            label.textContent = `${ff.dataset.type} - ${sliceSelect.value} slices`;
          });
          const qctrl = createQtyControl(0);
          qctrl.addEventListener("qtychange", () => {
            if (anySectionHasQty()) {
              sectionExtras?.classList.remove("hidden");
              addBtn?.classList.remove("hidden");
            } else {
              sectionExtras?.classList.add("hidden");
              addBtn?.classList.add("hidden");
            }
            updateTotals();
          });
          row.append(label, sliceSelect, qctrl);
          qtyList.appendChild(row);
        });
        addBtn.classList.remove("hidden");
      }));
    }

    /* -------------------------
       Extras controls (raita/salad) per card
       - Shows qty control on YES, removes it on NO
       ------------------------- */
    card.querySelectorAll(".local-extra-yes").forEach(yes => {
      yes.addEventListener("change", () => {
        if (!yes.checked) return;
        const extra = yes.dataset.extra;
        const qtyBox = card.querySelector(`.${extra}-qty`);
        if (!qtyBox) return;
        if (qtyBox.querySelector(".qty-control")) {
          qtyBox.classList.remove("hidden");
          return;
        }
        const q = createQtyControl(0);
        q.addEventListener("qtychange", () => {
          updateTotals();
        });
        qtyBox.classList.remove("hidden");
        qtyBox.appendChild(q);
        updateTotals();
      });
    });

    card.querySelectorAll(".local-extra-no").forEach(no => {
      no.addEventListener("change", () => {
        if (!no.checked) return;
        const extra = no.dataset.extra;
        const qtyBox = card.querySelector(`.${extra}-qty`);
        if (!qtyBox) return;
        qtyBox.innerHTML = "";
        qtyBox.classList.add("hidden");
        updateTotals();
      });
    });

    /* -------------------------
       Add to plate (gather selections) 
       ------------------------- */
   // REPLACE the existing addBtn?.addEventListener("click", (e) => { ... }) handler with this block
addBtn?.addEventListener("click", (e) => {
  const itemName = itemBtn.textContent.trim();
  const newItem = { name: itemName, parts: [], extras: [], included: true };

  // Collect any option/patty/sandwich rows inside this card's qtyList
  const rows = Array.from(qtyList.querySelectorAll(".option-row, .patty-row"));
  rows.forEach(row => {
    // find qty control (created by createQtyControl)
    const qctrl = row.querySelector(".qty-control");
    const qty = qctrl && qctrl.getQty ? qctrl.getQty() : parseInt(qctrl?.dataset?.qty || "0", 10);

    if (!qty || qty <= 0) return; // skip if no qty selected

    // Determine label text
    let labelText = (row.querySelector("div")?.textContent || "").trim();

    // Determine price:
    // 1) select (bun / sandwich selects)
    const select = row.querySelector("select");
    if (select && select.selectedOptions && select.selectedOptions[0]) {
      const opt = select.selectedOptions[0];
      const dataPrice = opt.dataset && opt.dataset.price ? parseInt(opt.dataset.price, 10) : 0;
      newItem.parts.push({ label: labelText, price: dataPrice, qty });
      return;
    }

    // 2) try to match a checkbox/input inside this card with a data-price (safe lookup)
    let price = 0;
    // look for an input in this card whose dataset.type appears in the label
    const allInputs = Array.from(card.querySelectorAll("input[type='checkbox'], input[type='radio']"));
    const matchInput = allInputs.find(inp => {
      const t = (inp.dataset.type || inp.value || "").toString().toLowerCase();
      return t && labelText.toLowerCase().includes(t);
    });
    if (matchInput && matchInput.dataset && matchInput.dataset.price) {
      price = parseInt(matchInput.dataset.price || "0", 10);
      newItem.parts.push({ label: labelText, price, qty });
      return;
    }

    // 3) fallback: try to parse "Rs N" from the visible label text
    const rsMatch = labelText.match(/Rs\s*([0-9]+)/i);
    if (rsMatch) {
      price = parseInt(rsMatch[1], 10);
    } else {
      // last fallback: try to get a data-price attribute on the option-row itself
      price = parseInt(row.dataset.price || "0", 10) || 0;
    }

    newItem.parts.push({ label: labelText, price: price || 0, qty });
  });

  // Burger bun rows (separate area)
  if (section.dataset.item === "burger") {
    $$(".patty-row", bunOptionsArea).forEach(row => {
      const label = row.querySelector("div")?.textContent?.trim() || "Burger";
      const bunSelect = row.querySelector("select");
      const qctrl = row.querySelector(".qty-control");
      const qty = qctrl && qctrl.getQty ? qctrl.getQty() : 0;
      if (!qty || qty <= 0 || !bunSelect) return;
      const key = label.toLowerCase().includes("shami") ? "shami"
                : label.toLowerCase().includes("cutlets") ? "cutlets"
                : "egg";
      const bunType = bunSelect.value;
      const price = BURGER_PRICE_MAP[key] && BURGER_PRICE_MAP[key][bunType] ? BURGER_PRICE_MAP[key][bunType] : 0;
      newItem.parts.push({ label: `${label} (${bunType} bun)`, price, qty });
    });
  }

  // Combo for biryani
  if (section.dataset.item === "biryani") {
    const comboChoice = card.querySelector(".combo-section input[type='radio']:checked");
    if (comboChoice) {
      newItem.parts.push({ label: `Combo (${comboChoice.value})`, price: 0, qty: 1 });
    }
  }

  // Collect extras (raita/salad) safely
  card.querySelectorAll(".local-extra-yes:checked").forEach(radio => {
    const extra = radio.dataset.extra;
    const qtyBox = card.querySelector(`.${extra}-qty .qty-control`);
    const qty = qtyBox && qtyBox.getQty ? qtyBox.getQty() : 0;
    if (qty > 0) newItem.extras.push({ label: `Extra ${extra}`, price: EXTRA_PRICE, qty });
  });

  // If nothing selected then show alert and stop (do NOT push empty item)
  if (newItem.parts.length === 0 && newItem.extras.length === 0) {
    alert("Please set quantity (How much) for at least one selection before adding to plate.");
    return;
  }

  // Add to plate
  plateItems.push(newItem);

  // UI reactions: sparkle + plate notification
  sparkleEffect(addBtn);
  showPlateNotification();

  // Reset UI for this card (uncheck inputs and clear generated areas)
  options.forEach(o => o.checked = false);
  patties.forEach(p => p.checked = false);
  fillings.forEach(f => f.checked = false);
  $$(".section-extras input[type='radio']", card).forEach(r => r.checked = false);
  if (bunOptionsArea) bunOptionsArea.innerHTML = "";
  qtyList.innerHTML = "";
  if (sectionExtras) sectionExtras.classList.add("hidden");
  if (comboSection) comboSection.classList.add("hidden");
  if (postComboExtras) postComboExtras.classList.add("hidden");
  addBtn.classList.add("hidden");
  body.classList.add("hidden");
  ["raita", "salad"].forEach(extra => {
    const qbox = card.querySelector(`.${extra}-qty`);
    if (qbox) { qbox.innerHTML = ""; qbox.classList.add("hidden"); }
  });

  // Re-render plate and totals
  renderPlateList();
});
  });

  // ====== Replaced hierarchical generator for Pink Herbal tea & Log Froze ketchup ======
(function hierarchicalNewItems() {
  // Helpers
  function el(tag, props = {}, ...children) {
    const e = document.createElement(tag);
    Object.entries(props).forEach(([k, v]) => {
      if (k === "class") e.className = v;
      else if (k === "html") e.innerHTML = v;
      else e.setAttribute(k, v);
    });
    children.forEach(c => { if (typeof c === "string") e.appendChild(document.createTextNode(c)); else if (c) e.appendChild(c); });
    return e;
  }

  function makeCheckbox(value, cls, labelText) {
    const id = `cb-${cls}-${Math.random().toString(36).slice(2,8)}`;
    const input = el("input", { type: "checkbox", class: cls, value });
    input.id = id;
    const label = el("label", {}, input, " ", labelText ?? value);
    return { input, label };
  }

  // Attach to a parent and return wrapper
  function createSectionWrapper(parent, title) {
    const wrapper = el("div", { class: "dynamic-section" });
    if (title) {
      const h = el("h4", {}, title);
      wrapper.appendChild(h);
    }
    parent.appendChild(wrapper);
    return wrapper;
  }

  // create a final combo row containing label + qty control
  function createFinalCombo(container, labelText, unitPrice, meta = {}) {
    const row = el("div", { class: "option-row combo-row" });
    const label = el("div", { class: "combo-label" }, labelText);
    const qctrl = createQtyControl(0);
    qctrl.addEventListener("qtychange", () => {
      // show add button if any qty > 0
      const any = Array.from(container.closest(".item-body").querySelectorAll(".qty-control")).some(q => q.getQty && q.getQty() > 0);
      const addBtn = container.closest(".item-card").querySelector(".add-plate");
      if (addBtn) {
        if (any) addBtn.classList.remove("hidden"); else addBtn.classList.add("hidden");
      }
      updateTotals();
    });
    row.append(label, qctrl);

    // attach metadata for later
    Object.entries(meta).forEach(([k, v]) => row.dataset[k] = v);

    container.appendChild(row);
    return row;
  }

  // TEA: hierarchical building
  (function wireTea() {
    const section = document.querySelector('.orderSection[data-item="pinktea"]');
    if (!section) return;

    // hide the global static blocks so user doesn't see duplicates
    const globalSweet = section.querySelector('.tea-sweetness');
    const globalSize = section.querySelector('.tea-size');
    const globalTopping = section.querySelector('.tea-topping-block');
    if (globalSweet) globalSweet.classList.add('hidden');
    if (globalSize) globalSize.classList.add('hidden');
    if (globalTopping) globalTopping.classList.add('hidden');

    // create dynamic area (insert before qty-list)
    let dyn = section.querySelector('.dynamic-area');
    const qtyList = section.querySelector('.qty-list');
    if (!dyn) {
      dyn = el('div', { class: 'dynamic-area' });
      qtyList.parentNode.insertBefore(dyn, qtyList);
    }

    // template option values (keeps labels consistent)
    const TEMP_OPTIONS = ['Hot', 'Cold'];
    const SWEET_OPTIONS = ['Sweet', 'Sugar-Free'];
    const SIZE_OPTIONS = [{ val: 'Small', price: 100 }, { val: 'Large', price: 150 }];
    const TOPPING_OPTIONS = ['With Topping', 'Without Topping']; // no qty for topping choice itself — it's a branch

    // Helper: clear downstream of a node
    function removeAfter(node, keep) {
      while (node.nextSibling) node.parentNode.removeChild(node.nextSibling);
    }

    // Build per-temp blocks when user toggles the top-level temp checkboxes
    // We'll use the existing top-level temp checkboxes as selectors
    const topTemps = Array.from(section.querySelectorAll('.tea-temp'));
    // For simplicity, attach change handler to top-level checkboxes that will recreate the whole dyn area
    function rebuildTeaDynamic() {
      dyn.innerHTML = "";
      const checkedTemps = topTemps.filter(t => t.checked).map(t => t.value);
      if (checkedTemps.length === 0) {
        qtyList.classList.add('hidden');
        section.querySelector('.add-plate').classList.add('hidden');
        return;
      }

      // For each selected temp, create its own subtree
      checkedTemps.forEach(temp => {
        const tempWrap = createSectionWrapper(dyn, `Temperature: ${temp}`);
        tempWrap.dataset.temp = temp;

        // Sweetness choices for this temp (checkboxes)
        const sweetWrap = el('div', { class: 'sub-sweetness' });
        sweetWrap.appendChild(el('h5', {}, 'Sweetness (select one or more)'));
        SWEET_OPTIONS.forEach(sv => {
          const { input, label } = makeCheckbox(sv, 'dyn-tea-sweet', sv);
          sweetWrap.appendChild(label);
          // on change, rebuild sizes subtree for this temp
          input.addEventListener('change', () => buildSizesForTemp(tempWrap));
        });
        tempWrap.appendChild(sweetWrap);

        // container for sizes under this temp (will hold per-sweet blocks)
        const sizesContainer = el('div', { class: 'sizes-container' });
        tempWrap.appendChild(sizesContainer);

        // initial nothing in sizes; sizes will be created when sweets selected
      });

      // update UI
      
    }

    function buildSizesForTemp(tempWrap) {
      const sizesContainer = tempWrap.querySelector('.sizes-container');
      sizesContainer.innerHTML = "";

      const selectedSweets = Array.from(tempWrap.querySelectorAll('.dyn-tea-sweet:checked')).map(i => i.value);
      if (!selectedSweets.length) return;

      selectedSweets.forEach(sweet => {
        const sweetBlock = el('div', { class: 'sweet-block' });
        sweetBlock.appendChild(el('h6', {}, `${sweet}`));
        // size checkboxes for this sweet under this temp
        const sizeChoices = el('div', { class: 'size-choices' });
        SIZE_OPTIONS.forEach(sz => {
          const { input, label } = makeCheckbox(sz.val, 'dyn-tea-size', `${sz.val} (Rs ${sz.price})`);
          // store price on input element
          input.dataset.price = String(sz.price);
          sizeChoices.appendChild(label);
          input.addEventListener('change', () => buildToppingsForSize(tempWrap, sweetBlock, sweet));
        });
        sweetBlock.appendChild(sizeChoices);
        // container for toppings and final qty rows
        const toppingsContainer = el('div', { class: 'toppings-container' });
        sweetBlock.appendChild(toppingsContainer);

        sizesContainer.appendChild(sweetBlock);
      });

    
    }

    function buildToppingsForSize(tempWrap, sweetBlock, sweet) {
      const toppingsContainer = sweetBlock.querySelector('.toppings-container');
      toppingsContainer.innerHTML = "";

      const selectedSizes = Array.from(sweetBlock.querySelectorAll('.dyn-tea-size:checked')).map(i => ({ val: i.value, price: parseInt(i.dataset.price || "0", 10) }));
      if (!selectedSizes.length) return;

      // For user choice, allow With/Without toppings per size selection
      selectedSizes.forEach(sz => {
        // create toppings choices (two checkboxes: With / Without)
        const tblock = el('div', { class: 'tblock' });
        tblock.appendChild(el('div', {}, `Size: ${sz.val}`));
        const withT = makeCheckbox('With Topping', 'dyn-tea-topping', 'With Topping');
        const withoutT = makeCheckbox('Without Topping', 'dyn-tea-topping', 'Without Topping');
        tblock.appendChild(withT.label);
        tblock.appendChild(withoutT.label);
        // When user toggles toppings, create final qty rows for each topping selection
        withT.input.addEventListener('change', () => finalizeComboRows(tempWrap));
        withoutT.input.addEventListener('change', () => finalizeComboRows(tempWrap));

        toppingsContainer.appendChild(tblock);
      });

      
    }

    // Create final combo rows under the tempWrap's subtree (one per temp-sweet-size-topping)
    function finalizeComboRows(tempWrap) {
      const containerForQty = tempWrap.querySelector('.final-qty-container') || (function(){
        const c = el('div', { class: 'final-qty-container' });
        tempWrap.appendChild(c);
        return c;
      })();
      containerForQty.innerHTML = "";

      // gather selected sweets, sizes and toppings for this tempWrap
      const sweets = Array.from(tempWrap.querySelectorAll('.dyn-tea-sweet:checked')).map(i => i.value);
      if (!sweets.length) return;
      sweets.forEach(sweet => {
        // find the sweetBlock for this sweet
        const sweetBlock = Array.from(tempWrap.querySelectorAll('.sweet-block')).find(sb => sb.querySelector('h6') && sb.querySelector('h6').textContent === sweet);
        if (!sweetBlock) return;
        const sizes = Array.from(sweetBlock.querySelectorAll('.dyn-tea-size:checked')).map(i => ({ val: i.value, price: parseInt(i.dataset.price || "0", 10) }));
        const tblocks = Array.from(sweetBlock.querySelectorAll('.tblock'));
        // for each selected size and for each topping checkbox selected under that size block create final rows
        sizes.forEach(sz => {
          // find tblock relevant to this size (we don't have exact binding per size element), so check tblocks and use whichever exists (structure uses one tblock per size)
          // We'll iterate tblocks and detect which topping inputs are checked.
          tblocks.forEach(tb => {
            const withInp = tb.querySelector('.dyn-tea-topping[value="With Topping"]');
            const withoutInp = tb.querySelector('.dyn-tea-topping[value="Without Topping"]');
            // If either is not present we still handle
            const toppingSelections = [];
            if (withInp && withInp.checked) toppingSelections.push('With Topping');
            if (withoutInp && withoutInp.checked) toppingSelections.push('Without Topping');

            toppingSelections.forEach(top => {
              const label = `${tempWrap.dataset.temp} – ${sweet} – ${sz.val} – ${top}`;
              const row = createFinalCombo(containerForQty, label, sz.price, (qty) => {
                // when any qty changes update totals and add-button visibility
                const any = Array.from(section.querySelectorAll('.final-qty-container .qty-control')).some(q => q.getQty && q.getQty() > 0);
                const addBtn = section.querySelector('.add-plate');
                if (addBtn) { if (any) addBtn.classList.remove('hidden'); else addBtn.classList.add('hidden'); }
                updateTotals();
              });
              // store metadata for later addition to plate
              row.dataset.comboPrice = String(sz.price);
              row.dataset.comboTemp = tempWrap.dataset.temp;
              row.dataset.comboSweet = sweet;
              row.dataset.comboSize = sz.val;
              row.dataset.comboTopping = top;
            });
          });
        });
      });

      containerForQty.classList.remove('hidden');
      qtyList.classList.remove('hidden');
    
    }

    // Wire top temperature global checkboxes to rebuild per-temp UI
    topTemps.forEach(cb => cb.addEventListener('change', () => {
      rebuildTeaDynamic();
    }));
  })();

  // KETCHUP hierarchical (per-type -> sizes -> qty)
  (function wireKetchup() {
    const section = document.querySelector('.orderSection[data-item="ketchup"]');
    if (!section) return;

    // hide global static size block
    const globalSize = section.querySelector('.ketchup-size-block');
    if (globalSize) globalSize.classList.add('hidden');

    let dyn = section.querySelector('.dynamic-area');
    const qtyList = section.querySelector('.qty-list');
    if (!dyn) {
      dyn = el('div', { class: 'dynamic-area' });
      qtyList.parentNode.insertBefore(dyn, qtyList);
    }

    const TYPE_OPTIONS = Array.from(section.querySelectorAll('.ketchup-type')).map(i => i.value);
    const SIZE_OPTIONS = [{ val: 'Small', price: 120 }, { val: 'Large', price: 200 }];

    // top types are checkboxes in markup; get references
    const topTypes = Array.from(section.querySelectorAll('.ketchup-type'));

    function rebuildKetchupDyn() {
      dyn.innerHTML = "";
      const checkedTypes = topTypes.filter(t => t.checked).map(t => t.value);
      if (!checkedTypes.length) {
        qtyList.classList.add('hidden');
        section.querySelector('.add-plate').classList.add('hidden');
        return;
      }

      checkedTypes.forEach(type => {
        const typeWrap = createSectionWrapper(dyn, `Type: ${type}`);
        typeWrap.dataset.type = type;

        // size choices inside this typeWrap
        const sizesWrap = el('div', { class: 'k-type-sizes' });
        SIZE_OPTIONS.forEach(sz => {
          const { input, label } = makeCheckbox(sz.val, 'dyn-ketchup-size', `${sz.val} (Rs ${sz.price})`);
          input.dataset.price = String(sz.price);
          sizesWrap.appendChild(label);
          input.addEventListener('change', () => buildKetchupQtys(typeWrap));
        });
        typeWrap.appendChild(sizesWrap);
      });
     
    }

    function buildKetchupQtys(typeWrap) {
      const qContainer = typeWrap.querySelector('.k-final-qty') || (function(){
        const c = el('div', { class: 'k-final-qty' });
        typeWrap.appendChild(c);
        return c;
      })();
      qContainer.innerHTML = "";

      const selectedSizes = Array.from(typeWrap.querySelectorAll('.dyn-ketchup-size:checked')).map(i => ({ val: i.value, price: parseInt(i.dataset.price || "0", 10) }));
      if (!selectedSizes.length) return;

      selectedSizes.forEach(sz => {
        const label = `${typeWrap.dataset.type} – ${sz.val}`;
        const row = createFinalCombo(qContainer, label, sz.price, (qty) => {
          const any = Array.from(section.querySelectorAll('.k-final-qty .qty-control')).some(q => q.getQty && q.getQty() > 0);
          const addBtn = section.querySelector('.add-plate');
          if (addBtn) { if (any) addBtn.classList.remove('hidden'); else addBtn.classList.add('hidden'); }
          updateTotals();
        });
        row.dataset.comboPrice = String(sz.price);
        row.dataset.comboType = typeWrap.dataset.type;
        row.dataset.comboSize = sz.val;
      });

      qContainer.classList.remove('hidden');
      qtyList.classList.remove('hidden');
      
    }

    topTypes.forEach(cb => cb.addEventListener('change', () => rebuildKetchupDyn()));
  })();

  // add-plate: collect all dyn combo rows within the section and push them to plateItems
  document.addEventListener('click', function(e) {
    const btn = e.target.closest('.add-plate');
    if (!btn) return;
    const section = btn.closest('.orderSection');
    if (!section) return;

    const dynRows = Array.from(section.querySelectorAll('.combo-row'));
    if (dynRows.length === 0) {
      alert("Set quantity for at least one combination.");
      return;
    }

    const newItem = { name: section.querySelector('.item-btn')?.textContent?.trim() || 'Item', parts: [], extras: [], included: true, _autoAdded: true };

    dynRows.forEach(row => {
      const qctrl = row.querySelector('.qty-control');
      const qty = qctrl && qctrl.getQty ? qctrl.getQty() : 0;
      if (!qty) return;
      const price = parseInt(row.dataset.comboPrice || "0", 10);

      if (section.dataset.item === 'pinktea') {
        const label = row.querySelector('.combo-label').textContent;
        newItem.parts.push({ label, price, qty });
        if (/With Topping/i.test(label)) {
          newItem.extras.push({ label: 'Nuts topping', price: EXTRA_PRICE, qty });
        }
      } else if (section.dataset.item === 'ketchup') {
        const label = row.querySelector('.combo-label').textContent;
        newItem.parts.push({ label, price, qty });
      }
    });

    if (newItem.parts.length === 0) {
      alert("Set quantity for at least one combination before adding.");
      return;
    }

    plateItems.push(newItem);
    renderPlateList();

    // Reset the section UI (uncheck top-level boxes and clear dynamic area)
    section.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
    const dynAreas = section.querySelectorAll('.dynamic-area');
    dynAreas.forEach(d => d.innerHTML = '');
    section.querySelectorAll('.qty-list').forEach(q => q.classList.add('hidden'), q => q.innerHTML = '');
    section.querySelectorAll('.add-plate').forEach(b => b.classList.add('hidden'));
  });
})();

  /* -------------------------
     Timing toggle logic
     ------------------------- */
  const nowCheck = document.getElementById("nowCheck");
  const scheduleTrigger = document.getElementById("scheduleTrigger");
  const scheduleBox = document.getElementById("scheduleTimeBox");

  if (nowCheck) {
    nowCheck.addEventListener("change", () => {
      if (nowCheck.checked) scheduleBox.classList.add("hidden");
    });
  }

  if (scheduleTrigger) {
    scheduleTrigger.addEventListener("click", () => {
      if (nowCheck) nowCheck.checked = false;
      scheduleBox.classList.remove("hidden");
      const st = document.getElementById("scheduledTime");
      if (st) st.focus();
    });
  }

  /* -------------------------
     Final order form and geolocation
     ------------------------- */
  let lastOrderMessage = "";

  // Geolocation button
  const getLocationBtn = $("#getLocation");
  const locationField = $("#locationField");
  if (getLocationBtn) {
    getLocationBtn.addEventListener("click", () => {
      if (!navigator.geolocation) {
        alert("Geolocation is not supported by this browser.");
        return;
      }
      navigator.geolocation.getCurrentPosition(position => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const locationLink = `https://www.google.com/maps?q=${lat},${lng}`;
        locationField.value = locationLink;
        locationField.style.cursor = "pointer";
        locationField.onclick = () => window.open(locationLink, "_blank");
      }, error => {
        console.error("Geolocation error:", error);
        if (error.code === error.PERMISSION_DENIED) alert("Permission denied for location. Please allow location access or paste a link manually.");
        else alert("Could not get location. Try again or enter location manually.");
      }, { timeout: 10000 });
    });
  }

  

  // Final order submit
  const finalForm = $("#finalOrderForm");
  if (finalForm) {
    finalForm.addEventListener("submit", function(e) {
      e.preventDefault();
      const name = $("#receiverName").value.trim();
      const contact = $("#receiverContact").value.trim();
      const location = $("#receiverLocation").value.trim();

      // Payment method: read selected radio
    const paymentEl = document.querySelector('input[name="paymentMethod"]:checked');
    const paymentMethod = paymentEl ? paymentEl.value : "Not specified";

      let summary = `Order from ${name}\nContact: ${contact}\nAddress: ${location}\n\n`;

      // Timing: use nowCheck and scheduledTime
      const now = $("#nowCheck");
      if (now && now.checked) {
        summary += `Delivery Time: Now\n\n`;
      } else {
        const scheduledTime = $("#scheduledTime").value || "Not specified";
        summary += `Scheduled Delivery Time: ${scheduledTime}\n\n`;
      }

      const liveLocation = $("#locationField").value;
      if (liveLocation) summary += `Live Location: ${liveLocation}\n\n`;

      // Add payment info
    summary += `Payment method: ${paymentMethod}\n\n`;

      let grand = 0;
    plateItems.forEach((it, idx) => {
      if (it.included === false) return;
      summary += `${idx + 1}. ${it.name}\n`;
      it.parts.forEach(p => {
        summary += `   - ${p.label} x${p.qty} = Rs ${p.price * p.qty}\n`;
        grand += p.price * p.qty;
      });
      if (it.extras) it.extras.forEach(e => {
        summary += `   + ${e.label} x${e.qty} = Rs ${e.price * e.qty}\n`;
        grand += e.price * e.qty;
      });
      summary += "\n";
    });


      summary += `\nTotal: Rs ${grand}\n\nI love your food LOG FROZE!`;

      lastOrderMessage = encodeURIComponent(summary);

      // Send to main WhatsApp number (open new tab)
      window.open(`https://wa.me/923294102524?text=${lastOrderMessage}`, "_blank");

      // Hide modal and show second step
      $("#finalOrderModal").classList.add("hidden");
      $("#secondNumberModal").classList.remove("hidden");

      // Try to send to sheets (best-effort)
       // Best-effort: send to sheets
    try {
      fetch("https://order-proxy.vercel.app", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Name: name,
          Contact: contact,
          Address: location,
          Location: $("#locationField").value,
          Items: plateItems.map(it => it.name).join(", "),
          total: grand,
          payment: paymentMethod
        })
      }).then(res => res.text()).then(txt => console.log("Sheets response:", txt)).catch(err => console.error("Sheets error:", err));
    } catch (err) {
      console.error("Fetch block failed:", err);
    }


      // Remove curious emoji now that user submitted the form
      const curious = document.querySelector(".curious-emoji");
      if (curious) curious.remove();

      finalForm.reset();
      renderPlateList();
    });
  }

  // Step 2 and 3 (second/third numbers) with final success flow
  $("#sendSecond")?.addEventListener("click", () => {
    if (lastOrderMessage) window.open(`https://wa.me/923298120448?text=${lastOrderMessage}`, "_blank");
    // user chose to also send to second number; show third modal next
    $("#secondNumberModal").classList.add("hidden");
    $("#thirdNumberModal").classList.remove("hidden");
  });
  $("#cancelSecond")?.addEventListener("click", () => {
    // user declined to send to second number; they already sent to first -> success
    $("#secondNumberModal").classList.add("hidden");
    showFinalSuccess();
  });

  $("#sendThird")?.addEventListener("click", () => {
    if (lastOrderMessage) window.open(`https://wa.me/923046472688?text=${lastOrderMessage}`, "_blank");
    $("#thirdNumberModal").classList.add("hidden");
    // after sending to third (last) -> success
    showFinalSuccess();
  });
  $("#cancelThird")?.addEventListener("click", () => {
    // user declined to send to third number -> success (they at least sent to first or second)
    $("#thirdNumberModal").classList.add("hidden");
    showFinalSuccess();
  });

  $("#closeFinalModal")?.addEventListener("click", () => $("#finalOrderModal").classList.add("hidden"));

  // Initial render
  renderPlateList();

  /* -------------------------
     initial page glow animation (brief)
     ------------------------- */
  document.body.classList.add("initial-glow");
  setTimeout(() => document.body.classList.remove("initial-glow"), 1600);

});
