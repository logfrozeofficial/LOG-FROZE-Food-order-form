// order.js
// Full behavior implementing the requirements described.

document.addEventListener("DOMContentLoaded", () => {
  
  /* -------------------------
     Global configuration & state
     ------------------------- */
  const EXTRA_PRICE = 50; // Rs 50 for both raita and salad (global)
  const plateItems = []; // items added to plate

  // Price maps for burgers & sandwiches (final prices provided)
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
     Helpers
     ------------------------- */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  function createQtyControl(initial = 0) {
    // initial 0 means placeholder "How much"
    const wrapper = document.createElement("div");
    wrapper.className = "qty-control";

    const minus = document.createElement("button");
    minus.type = "button";
    minus.textContent = "-";

    const display = document.createElement("div");
    display.className = "qty-display";
    display.dataset.qty = String(initial);
    display.textContent = initial > 0 ? String(initial) : "How much";
    if (initial === 0) display.classList.add("qty-placeholder");

    const plus = document.createElement("button");
    plus.type = "button";
    plus.textContent = "+";

    wrapper.append(minus, display, plus);

    // internal qty
    let qty = initial;

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
      // pressing minus when value is empty -> stays unchanged
      if (qty === 0) return;
      if (qty > 0) qty--;
      updateDisplay();
    });

    plus.addEventListener("click", () => {
      // pressing plus first time -> starts from 1 (not 0)
      if (qty === 0) qty = 1;
      else qty++;
      updateDisplay();
    });

    wrapper.getQty = () => qty;
    wrapper.setQty = (v) => { qty = Math.max(0, Math.floor(v)); updateDisplay(); };

    return wrapper;
  }

  function formatItemLabel(name, parts) {
    return `${name} ${parts.map(p => `- ${p.label} x${p.qty}`).join(", ")}`;
  }

  function calcTotal() {
  let total = 0;
  plateItems.forEach(it => {
    if (it.included === false) return;
    it.parts.forEach(p => total += p.price * p.qty);
    if (it.extras) it.extras.forEach(e => total += e.price * e.qty);
  });
  return total; // ✅ this was missing
}


  /* -------------------------
     UI references
     ------------------------- */
  const orderSections = $$(".orderSection");
  const myPlateBtn = $("#myPlateBtn");
  const platePanel = $("#platePanel");
  const plateList = $("#plateList");
  const totalSpan = $("#total");
  const finalOrderBtn = $("#finalOrder");
  const closePlateBtn = $("#closePlate");


  /* -------------------------
     Activation & plate panel
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
// Close the plate panel
  platePanel.classList.add("hidden");
platePanel.setAttribute("aria-hidden", "true");

  // Show modal instead of alert
  document.getElementById("finalOrderModal").classList.remove("hidden");
});



// Global variable to hold the last order message
let lastOrderMessage = "";

// Step 1: Final order form submit
document.getElementById("finalOrderForm").addEventListener("submit", function(e) {
  e.preventDefault();

  const name = document.getElementById("receiverName").value.trim();
  const contact = document.getElementById("receiverContact").value.trim();
  const location = document.getElementById("receiverLocation").value.trim();

  let summary = `Order from ${name}\nContact: ${contact}\nAddress: ${location}\n\n`;
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

  summary += `\nTotal: Rs ${grand}\n\nThank you for ordering from LOG FROZE!`;

  // Save globally so other listeners can use it
  lastOrderMessage = encodeURIComponent(summary);

  // Step 1: Send to primary number
  window.open(`https://wa.me/923294102524?text=${lastOrderMessage}`, "_blank");

  // Hide main modal, show step 2 modal
  document.getElementById("finalOrderModal").classList.add("hidden");
  document.getElementById("secondNumberModal").classList.remove("hidden");
    // ✅ Send to Google Sheets
  try {
    fetch("https://script.google.com/macros/s/AKfycbxpU9YlZ2uHQvYTLcBfgJtGVzixqictvx32U0eamXtHrU1yqPVev7mVPSiNBa5rN2GD/exec", {
      method: "POST",
      body: JSON.stringify({
        name,
        contact,
        location,
        items: plateItems.map(it => it.name).join(", "),
        total: grand
      })
    })
    .then(res => res.text())
    .then(txt => console.log("Sheets response:", txt))
    .catch(err => console.error("Sheets error:", err));
  } catch (err) {
    console.error("Fetch block failed:", err);
  }
  // ✅ Modal transitions 
  document.getElementById("finalOrderModal").classList.add("hidden"); 
  document.getElementById("secondNumberModal").classList.remove("hidden");

  this.reset();
});

// Step 2: Send to second number
document.getElementById("sendSecond").addEventListener("click", () => {
  window.open(`https://wa.me/923298120448?text=${lastOrderMessage}`, "_blank");
  document.getElementById("secondNumberModal").classList.add("hidden");
  document.getElementById("thirdNumberModal").classList.remove("hidden");
});

document.getElementById("cancelSecond").addEventListener("click", () => {
  document.getElementById("secondNumberModal").classList.add("hidden");
});

// Step 3: Send to third number
document.getElementById("sendThird").addEventListener("click", () => {
  window.open(`https://wa.me/923046472688?text=${lastOrderMessage}`, "_blank");
  document.getElementById("thirdNumberModal").classList.add("hidden");
});

document.getElementById("cancelThird").addEventListener("click", () => {
  document.getElementById("thirdNumberModal").classList.add("hidden");
});
document.getElementById("closeFinalModal").addEventListener("click", () => {
  document.getElementById("finalOrderModal").classList.add("hidden");
});

const name = document.getElementById("receiverName").value.trim();
const contact = document.getElementById("receiverContact").value.trim();
const location = document.getElementById("receiverLocation").value.trim();






  /* -------------------------
     Render plate list
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
        updateTotals();
        renderPlateList();
      });

      li.append(chk, title, details, removeBtn);
      plateList.appendChild(li);
    });


  }

  function updateTotals() {
    const total = calcTotal();
    totalSpan.textContent = total;
  }

  /* -------------------------
     Utility: check if any section has qty >=1
     ------------------------- */
  function anySectionHasQty() {
    // we will scan all qty-controls in the document
    const qcontrols = $$(".qty-control");
    return qcontrols.some(q => {
      const val = q.getQty ? q.getQty() : parseInt(q.dataset.qty || "0", 10);
      return val > 0;
    });
  }

 

  /* -------------------------
     Attach behavior to each item-card
     ------------------------- */
  $$(".orderSection").forEach(section => {
    
    const card = section;
    const itemCard = $(".item-card", card);
    const imageStack = $(".image-stack", card);
    const itemBtn = $(".item-btn", card);
    const body = $(".item-body", card);
    const options = $$(".option", card);
    const patties = $$(".patty", card);
    const fillings = $$(".filling", card);
    const slicesSelect = $(".slice-select", card);
    const bunOptionsArea = $(".bun-options", card);
    const qtyList = $(".qty-list", card);
    const addBtn = $(".add-plate", card);
    const sectionExtras = $(".section-extras", card);
    const comboSection = $(".combo-section", card);
    const postComboExtras = $(".post-combo-extras", card);

    // image swap behavior (click toggles swap class)
    if (imageStack) {
      imageStack.addEventListener("click", () => {
        imageStack.classList.toggle("swap");
      });
    }

    // item button toggles body
    itemBtn.addEventListener("click", () => {
      body.classList.toggle("hidden");
    });

    // Generic options (checkboxes) handling: when any option checked -> show qty controls (one per checked option)
    if (options.length) {
      options.forEach(opt => {
        opt.addEventListener("change", () => {
          // rebuild qty-list
          qtyList.innerHTML = "";
          const checked = options.filter(o => o.checked);
          checked.forEach(o => {
            const row = document.createElement("div");
            row.className = "option-row";
            const label = document.createElement("div");
            label.textContent = `${o.dataset.type} (Rs ${o.dataset.price})`;
            const qctrl = createQtyControl(0); // start with placeholder
            qctrl.addEventListener("qtychange", () => {
              // when any qty > 0, show section extras and global extras area
              if (anySectionHasQty()) {
                sectionExtras?.classList.remove("hidden");
                addBtn?.classList.remove("hidden");
              } else {
                sectionExtras?.classList.add("hidden");
                addBtn?.classList.add("hidden");
              }
              checkGlobalExtrasVisibility();
              updateTotals();
            });
            row.append(label, qctrl);
            qtyList.appendChild(row);
          });

          // visibility rules
          if (checked.length === 0) {
            qtyList.classList.add("hidden");
            sectionExtras?.classList.add("hidden");
            addBtn?.classList.add("hidden");
          } else {
            qtyList.classList.remove("hidden");
            // extras remain hidden until any qty > 0 (handled by qtychange)
          }
          if (!anySectionHasQty()) {
  // hide extras and reset them
  $$(".local-extra-yes", card).forEach(r => r.checked = false);
  $$(".local-extra-no", card).forEach(radio => {
  radio.addEventListener("change", () => {
    const extra = radio.dataset.extra;
    const qtyBox = card.querySelector(`.${extra}-qty`);
    if (qtyBox) {
      qtyBox.innerHTML = "";
      qtyBox.classList.add("hidden");
    }
    updateTotals();
  });
});

}

        });
      });
    }

    // Biryani: show combo only after qty entered
    if (comboSection) {
      // watch qty-list for changes
      const observer = new MutationObserver(() => {
        // if any qty > 0 in this card -> show comboSection
        const localQtys = $$(".qty-control", card);
        const hasQty = localQtys.some(q => q.getQty && q.getQty() > 0);
        if (hasQty) comboSection.classList.remove("hidden");
        else {
          comboSection.classList.add("hidden");
          postComboExtras.classList.add("hidden");
          // reset radios
          $$(".combo-section input[type='radio']", card).forEach(r => r.checked = false);
        }
        if (!anySectionHasQty()) {
  // hide extras and reset them
  $$(".local-extra-yes", card).forEach(r => r.checked = false);
  $$(".local-extra-no", card).forEach(radio => {
  radio.addEventListener("change", () => {
    const extra = radio.dataset.extra;
    const qtyBox = card.querySelector(`.${extra}-qty`);
    if (qtyBox) {
      qtyBox.innerHTML = "";
      qtyBox.classList.add("hidden");
    }
    updateTotals();
  });
});

}

      });
      observer.observe(qtyList, { childList: true, subtree: true });
      // when combo radio selected -> show post-combo extras
      $$(".combo-section input[type='radio']", card).forEach(r => {
        r.addEventListener("change", () => {
          postComboExtras.classList.remove("hidden");
          // post-combo extras will toggle global extras when user selects yes/no (handled below)
        });
      });
    }

    // Chinese rice extras: show only after qty > 0
    if (sectionExtras && section.dataset.item === "rice") {
      // extras are radio groups already in HTML; they should remain hidden until qty>0
      const observer = new MutationObserver(() => {
        const localQtys = $$(".qty-control", card);
        const hasQty = localQtys.some(q => q.getQty && q.getQty() > 0);
        if (hasQty) sectionExtras.classList.remove("hidden");
        else {
          sectionExtras.classList.add("hidden");
          // reset radios
          $$(".section-extras input[type='radio']", card).forEach(r => r.checked = false);
        }
      });
      observer.observe(qtyList, { childList: true, subtree: true });
    }

    // Burger logic: when patties selected -> show bun options and qty per patty
    if (patties.length) {
      patties.forEach(p => {
        p.addEventListener("change", () => {
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
            const key = pp.dataset.key; // shami/cutlets/egg
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
              // show extras and global extras only when any qty > 0
              if (anySectionHasQty()) {
                sectionExtras?.classList.remove("hidden");
                addBtn?.classList.remove("hidden");
              } else {
                sectionExtras?.classList.add("hidden");
                addBtn?.classList.add("hidden");
              }
              if (!anySectionHasQty()) {
  // hide extras and reset them
  $$(".local-extra-yes", card).forEach(r => r.checked = false);
 $$(".local-extra-no", card).forEach(radio => {
  radio.addEventListener("change", () => {
    const extra = radio.dataset.extra;
    const qtyBox = card.querySelector(`.${extra}-qty`);
    if (qtyBox) {
      qtyBox.innerHTML = "";
      qtyBox.classList.add("hidden");
    }
    updateTotals();
  });
});

}

              checkGlobalExtrasVisibility();
              updateTotals();
            });
            row.append(label, bunSelect, qctrl);
            bunOptionsArea.appendChild(row);
          });
          bunOptionsArea.classList.remove("hidden");
        });
      });
    }

   // Sandwich logic: when filling selected -> show slice selectors (one per filling)
if (fillings.length) {
  fillings.forEach(f => {
    f.addEventListener("change", () => {
      const checked = fillings.filter(ff => ff.checked);
      qtyList.innerHTML = "";
      if (checked.length === 0) {
        addBtn.classList.add("hidden");
        sectionExtras?.classList.add("hidden");
        return;
      }

      // Build one row per filling with its own slice dropdown + qty control
      checked.forEach(ff => {
        const row = document.createElement("div");
        row.className = "option-row";

        const label = document.createElement("div");
        label.textContent = `${ff.dataset.type} - 3 slices`; // default

        const sliceSelect = document.createElement("select");
        ["2", "3", "4"].forEach(val => {
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
    });
  });
}


    
// Local extras (raita/salad) inside each item card
$$(".local-extra-yes", card).forEach(radio => {
  radio.addEventListener("change", () => {
    const extra = radio.dataset.extra; // 'raita' or 'salad'
    const qtyBox = card.querySelector(`.${extra}-qty`);
    if (qtyBox && !qtyBox.querySelector(".qty-control")) {
      const q = createQtyControl(0); // start with 1
      q.addEventListener("qtychange", () => {
        updateTotals(); // recalc total when qty changes
      });
      qtyBox.classList.remove("hidden");
      qtyBox.appendChild(q);
    }
  });
});

$$(".local-extra-no", card).forEach(radio => {
  radio.addEventListener("change", () => {
    const extra = radio.dataset.extra;
    const qtyBox = card.querySelector(`.${extra}-qty`);
    if (qtyBox) {
      qtyBox.innerHTML = "";
      qtyBox.classList.add("hidden");
      updateTotals();
    }
  });
});



    /* -------------------------
       Add to plate button: gather selections for this card
       ------------------------- */
    addBtn?.addEventListener("click", () => {
      const itemName = itemBtn.textContent.trim();
      const newItem = { name: itemName, parts: [], extras: [], included: true };

      // Options (generic)
      if (options.length) {
        const checked = options.filter(o => o.checked);
        const rows = $$(".option-row", qtyList);
        checked.forEach((o, idx) => {
          const qctrl = rows[idx] ? rows[idx].querySelector(".qty-control") : null;
          const qty = qctrl && qctrl.getQty ? qctrl.getQty() : 0;
          if (qty > 0) newItem.parts.push({ label: o.dataset.type, price: parseInt(o.dataset.price, 10), qty });
        });
      }

      // Biryani: main option + combo extras (post-combo extras are added as extras)
      if (section.dataset.item === "biryani") {
        const mainOpt = $(".option:checked", card);
        if (mainOpt) {
          const row = $$(".option-row", qtyList)[0];
          const qctrl = row ? row.querySelector(".qty-control") : null;
          const qty = qctrl && qctrl.getQty ? qctrl.getQty() : 0;
          if (qty > 0) newItem.parts.push({ label: mainOpt.dataset.type, price: parseInt(mainOpt.dataset.price, 10), qty });
        }
        // post-combo extras: if user selected yes in post-combo extras, mark global extras enabled (global qty handled separately)
        const postRaitaYes = $(`input[name="biryani-raita"][value="yes"]`, card);
        const postSaladYes = $(`input[name="biryani-salad"][value="yes"]`, card);
       
      }

      // Chinese rice: main + extras (extras are global)
      if (section.dataset.item === "rice") {
        const mainOpt = $(".option:checked", card);
        if (mainOpt) {
          const row = $$(".option-row", qtyList)[0];
          const qctrl = row ? row.querySelector(".qty-control") : null;
          const qty = qctrl && qctrl.getQty ? qctrl.getQty() : 0;
          if (qty > 0) newItem.parts.push({ label: mainOpt.dataset.type, price: parseInt(mainOpt.dataset.price, 10), qty });
        }
        // section extras radios: if yes -> enable global extras
        const raitaYes = $(`input[name="rice-raita"][value="yes"]`, card);
        const saladYes = $(`input[name="rice-salad"][value="yes"]`, card);
     
      }

      // Burger: patties + bun options
      if (section.dataset.item === "burger") {
        const bunRows = $$(".patty-row", bunOptionsArea);
        bunRows.forEach(row => {
          const label = row.querySelector("div").textContent.trim();
          const bunSelect = row.querySelector("select");
          const qctrl = row.querySelector(".qty-control");
          const qty = qctrl && qctrl.getQty ? qctrl.getQty() : 0;
          if (qty > 0) {
            const key = label.toLowerCase().includes("shami") ? "shami" : label.toLowerCase().includes("cutlets") ? "cutlets" : "egg";
            const bunType = bunSelect.value;
            const price = BURGER_PRICE_MAP[key][bunType];
            newItem.parts.push({ label: `${label} (${bunType} bun)`, price, qty });
          }
        });
        // section extras radios -> enable global extras if yes
        const raitaYes = $(`input[name="burger-raita"][value="yes"]`, card);
        const saladYes = $(`input[name="burger-salad"][value="yes"]`, card);
      
      }

   // Sandwich: fillings x slice combos
if (section.dataset.item === "sandwich") {
  const rows = $$(".option-row", qtyList);
  rows.forEach(row => {
    const labelDiv = row.querySelector("div");
    const sliceSelect = row.querySelector("select");
    const qctrl = row.querySelector(".qty-control");

    const qty = qctrl && qctrl.getQty ? qctrl.getQty() : 0;
    if (qty > 0) {
      const fillingType = labelDiv.textContent.split(" - ")[0]; // e.g. "Shami"
      const sliceVal = sliceSelect ? sliceSelect.value : "3";
      const key = fillingType.toLowerCase();
      const price = SANDWICH_PRICE_MAP[key] ? SANDWICH_PRICE_MAP[key][sliceVal] : 0;
      newItem.parts.push({ label: `${fillingType} - ${sliceVal} slices`, price, qty });
    }
  });

  // section extras radios -> enable global extras if yes
  const raitaYes = $(`input[name="sandwich-raita"][value="yes"]`, card);
  const saladYes = $(`input[name="sandwich-salad"][value="yes"]`, card);
}


      // If no parts were added (user didn't set qtys) -> warn
      if (newItem.parts.length === 0) {
        alert("Please set quantity (How much) for at least one selection before adding to plate.");
        return;
      }
      // Collect local extras
const localExtrasYes = $$(".local-extra-yes:checked", card);
localExtrasYes.forEach(radio => {
  const extra = radio.dataset.extra; // 'raita' or 'salad'
  const qtyBox = card.querySelector(`.${extra}-qty .qty-control`);
  const qty = qtyBox && qtyBox.getQty ? qtyBox.getQty() : 0;
  if (qty > 0) {
    newItem.extras.push({ label: `Extra ${extra}`, price: EXTRA_PRICE, qty });
  }
});


      // Add to plate
      plateItems.push(newItem);

      // Reset UI for this card: uncheck options and hide controls
      $$(".option", card).forEach(o => o.checked = false);
      $$(".patty", card).forEach(p => p.checked = false);
      $$(".filling", card).forEach(f => f.checked = false);
      $$(".section-extras input[type='radio']", card).forEach(r => r.checked = false);
      if (bunOptionsArea) bunOptionsArea.innerHTML = "";
      qtyList.innerHTML = "";
      if (sectionExtras) sectionExtras.classList.add("hidden");
      if (comboSection) comboSection.classList.add("hidden");
      if (postComboExtras) postComboExtras.classList.add("hidden");
      addBtn.classList.add("hidden");

      // Re-render plate
      renderPlateList();
    });
  });

  /* -------------------------
     Initial render & helpers
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
        renderPlateList();
      });

      li.append(chk, title, details, removeBtn);
      plateList.appendChild(li);
    });
  }

  // initial state: hide plate button


  // expose updateTotals
  function updateTotals() {
    const total = calcTotal();
    totalSpan.textContent = total;
  }

  // initial render
  renderPlateList();
});




