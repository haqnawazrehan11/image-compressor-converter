const fileInput =
  document.getElementById("fileInput");

const emptyState =
  document.getElementById("emptyState");

const canvasWrapper =
  document.getElementById("canvasWrapper");

const bottomBar =
  document.getElementById("bottomBar");

const canvas =
  document.getElementById("editorCanvas");

const ctx =
  canvas.getContext("2d");

const exportCanvas =
  document.getElementById("exportCanvas");

const exportCtx =
  exportCanvas.getContext("2d");

const widthInput =
  document.getElementById("widthInput");

const heightInput =
  document.getElementById("heightInput");

const lockRatio =
  document.getElementById("lockRatio");

const exportModal =
  document.getElementById("exportModal");

const exportFormat =
  document.getElementById("exportFormat");

const maxSizeInput =
  document.getElementById("maxSizeInput");

const sizeUnit =
  document.getElementById("sizeUnit");

const currentSize =
  document.getElementById("currentSize");

const compressSlider =
  document.getElementById("compressSlider");

const compressValue =
  document.getElementById("compressValue");

const fileNameInput =
  document.getElementById("fileNameInput");

const extension =
  document.querySelector(".extension");

const fromFormat =
  document.getElementById("fromFormat");

const toFormat =
  document.getElementById("toFormat");

const exportDimensions =
  document.getElementById("exportDimensions");

const zoomValue =
  document.getElementById("zoomValue");

const layerName =
  document.getElementById("layerName");


let originalImage = null;

let originalFile = null;

let originalWidth = 0;

let originalHeight = 0;

let zoom = 1;

let rotation = 0;

let flipX = 1;

let flipY = 1;

let brightness = 100;

let contrast = 100;

let grayscale = 0;

let blur = 0;

let backgroundColor = "transparent";


let history = [];

let historyIndex = -1;


/* FILE OPEN */

fileInput.addEventListener(
  "change",
  (event) => {

    const files =
      Array.from(event.target.files);

    if (!files.length) {
      return;
    }

    loadImage(files[0]);

  }
);


/* LOAD IMAGE */

function loadImage(file) {

  if (
    ![
      "image/jpeg",
      "image/png",
      "image/webp"
    ].includes(file.type)
  ) {

    alert(
      "Please select JPG, PNG or WebP."
    );

    return;
  }


  originalFile = file;


  const reader =
    new FileReader();


  reader.onload =
    (event) => {

      const image =
        new Image();


      image.onload =
        () => {

          originalImage =
            image;

          originalWidth =
            image.naturalWidth;

          originalHeight =
            image.naturalHeight;


          widthInput.value =
            originalWidth;

          heightInput.value =
            originalHeight;


          layerName.textContent =
            file.name;


          emptyState.classList.add(
            "hidden"
          );


          canvasWrapper.classList.remove(
            "hidden"
          );


          bottomBar.classList.remove(
            "hidden"
          );


          resetEditor();


          saveHistory();

        };


      image.src =
        event.target.result;

    };


  reader.readAsDataURL(file);

}


/* DRAW */

function drawImage() {

  if (!originalImage) {
    return;
  }


  const width =
    Number(widthInput.value) ||
    originalWidth;


  const height =
    Number(heightInput.value) ||
    originalHeight;


  canvas.width =
    width;

  canvas.height =
    height;


  ctx.save();


  ctx.clearRect(
    0,
    0,
    width,
    height
  );


  /*
    Background
  */

  if (
    backgroundColor !==
    "transparent"
  ) {

    ctx.fillStyle =
      backgroundColor;

    ctx.fillRect(
      0,
      0,
      width,
      height
    );

  }


  /*
    Filters
  */

  ctx.filter =
    `
      brightness(${brightness}%)
      contrast(${contrast}%)
      grayscale(${grayscale}%)
      blur(${blur}px)
    `;


  ctx.translate(
    width / 2,
    height / 2
  );


  ctx.scale(
    flipX,
    flipY
  );


  if (rotation !== 0) {

    ctx.rotate(
      rotation *
      Math.PI /
      180
    );

  }


  ctx.drawImage(
    originalImage,
    -width / 2,
    -height / 2,
    width,
    height
  );


  ctx.restore();


  exportDimensions.textContent =
    `${width}×${height}px`;


  updateExportPreview();

}


/* RESIZE */

widthInput.addEventListener(
  "input",
  () => {

    if (!lockRatio.checked) {
      return;
    }


    const ratio =
      originalHeight /
      originalWidth;


    const width =
      Number(widthInput.value);


    if (width) {

      heightInput.value =
        Math.round(
          width * ratio
        );

    }

  }
);


heightInput.addEventListener(
  "input",
  () => {

    if (!lockRatio.checked) {
      return;
    }


    const ratio =
      originalWidth /
      originalHeight;


    const height =
      Number(heightInput.value);


    if (height) {

      widthInput.value =
        Math.round(
          height * ratio
        );

    }

  }
);


document
  .getElementById("applyResize")
  .addEventListener(
    "click",
    () => {

      drawImage();

      saveHistory();

    }
  );


/* TOOLS */

document
  .querySelectorAll(".tool")
  .forEach(
    (button) => {

      button.addEventListener(
        "click",
        () => {

          document
            .querySelectorAll(".tool")
            .forEach(
              (item) =>
                item.classList.remove(
                  "active"
                )
            );


          button.classList.add(
            "active"
          );


          openTool(
            button.dataset.tool
          );

        }
      );

    }
  );


/* OPEN TOOL */

function openTool(tool) {

  const resizePanel =
    document.getElementById(
      "resizePanel"
    );

  const otherPanel =
    document.getElementById(
      "otherPanel"
    );

  const title =
    document.getElementById(
      "otherTitle"
    );

  const content =
    document.getElementById(
      "otherContent"
    );


  if (tool === "resize") {

    resizePanel.classList.remove(
      "hidden"
    );

    otherPanel.classList.add(
      "hidden"
    );

    return;

  }


  resizePanel.classList.add(
    "hidden"
  );

  otherPanel.classList.remove(
    "hidden"
  );


  title.textContent =
    tool.charAt(0).toUpperCase() +
    tool.slice(1);


  content.innerHTML =
    getToolContent(tool);


  activateToolControls(
    tool
  );

}


/* TOOL CONTENT */

function getToolContent(tool) {

  if (tool === "crop") {

    return `

      <p style="margin-bottom:15px;color:#778399">
        Use the resize controls to set
        your desired image dimensions.
      </p>

      <button
        class="other-button"
        id="squareCrop"
      >
        Make Square
      </button>

      <button
        class="other-button"
        id="landscapeCrop"
      >
        16:9 Landscape
      </button>

      <button
        class="other-button"
        id="portraitCrop"
      >
        9:16 Portrait
      </button>

    `;

  }


  if (tool === "background") {

    return `

      <p style="margin-bottom:12px;color:#778399">
        Choose a background color.
      </p>

      <input
        type="color"
        id="bgColorTool"
        class="color-option"
        value="#ffffff"
      >

      <button
        class="other-button"
        id="transparentBg"
        style="margin-top:12px"
      >
        Transparent Background
      </button>

    `;

  }


  if (tool === "filters") {

    return `

      <label>
        Brightness
      </label>

      <input
        id="brightnessControl"
        class="range-option"
        type="range"
        min="50"
        max="150"
        value="100"
      >

      <br><br>

      <label>
        Contrast
      </label>

      <input
        id="contrastControl"
        class="range-option"
        type="range"
        min="50"
        max="150"
        value="100"
      >

      <br><br>

      <label>
        Grayscale
      </label>

      <input
        id="grayscaleControl"
        class="range-option"
        type="range"
        min="0"
        max="100"
        value="0"
      >

      <br><br>

      <label>
        Blur
      </label>

      <input
        id="blurControl"
        class="range-option"
        type="range"
        min="0"
        max="10"
        value="0"
      >

      <br><br>

      <button
        class="other-button"
        id="resetFilters"
      >
        Reset Filters
      </button>

    `;

  }


  if (tool === "transform") {

    return `

      <button
        class="other-button"
        id="rotateLeft"
      >
        ↶ Rotate Left
      </button>

      <button
        class="other-button"
        id="rotateRight"
      >
        ↷ Rotate Right
      </button>

      <button
        class="other-button"
        id="flipHorizontal"
      >
        ↔ Flip Horizontal
      </button>

      <button
        class="other-button"
        id="flipVertical"
      >
        ↕ Flip Vertical
      </button>

    `;

  }


  if (tool === "watermark") {

    return `

      <input
        id="watermarkText"
        type="text"
        placeholder="Watermark text"
        style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px"
      >

      <button
        class="other-button"
        id="addWatermark"
        style="margin-top:10px"
      >
        Add Watermark
      </button>

    `;

  }


  if (tool === "slug") {

    return `

      <input
        id="slugText"
        type="text"
        placeholder="File name"
        style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px"
      >

      <button
        class="other-button"
        id="applySlug"
        style="margin-top:10px"
      >
        Apply File Name
      </button>

    `;

  }


  if (tool === "draw") {

    return `

      <p style="color:#778399;margin-bottom:15px">
        Drawing mode uses your mouse
        or touch on the image.
      </p>

      <input
        type="color"
        id="drawColor"
        class="color-option"
        value="#ff0000"
      >

      <br><br>

      <label>
        Brush Size
      </label>

      <input
        id="brushSize"
        class="range-option"
        type="range"
        min="1"
        max="30"
        value="5"
      >

      <br><br>

      <button
        class="other-button"
        id="clearDrawing"
      >
        Clear Drawing
      </button>

    `;

  }


  if (tool === "cutout") {

    return `

      <p style="color:#778399">
        Background removal can be added
        as an advanced feature.
      </p>

    `;

  }


  return `
    <p style="color:#778399">
      Select a tool to edit your image.
    </p>
  `;

}


/* TOOL CONTROLS */

function activateToolControls(tool) {


  if (tool === "background") {

    const color =
      document.getElementById(
        "bgColorTool"
      );


    color.addEventListener(
      "input",
      () => {

        backgroundColor =
          color.value;

        drawImage();

      }
    );


    document
      .getElementById(
        "transparentBg"
      )
      .addEventListener(
        "click",
        () => {

          backgroundColor =
            "transparent";

          drawImage();

        }
      );

  }


  if (tool === "filters") {

    document
      .getElementById(
        "brightnessControl"
      )
      .addEventListener(
        "input",
        (e) => {

          brightness =
            Number(e.target.value);

          drawImage();

        }
      );


    document
      .getElementById(
        "contrastControl"
      )
      .addEventListener(
        "input",
        (e) => {

          contrast =
            Number(e.target.value);

          drawImage();

        }
      );


    document
      .getElementById(
        "grayscaleControl"
      )
      .addEventListener(
        "input",
        (e) => {

          grayscale =
            Number(e.target.value);

          drawImage();

        }
      );


    document
      .getElementById(
        "blurControl"
      )
      .addEventListener(
        "input",
        (e) => {

          blur =
            Number(e.target.value);

          drawImage();

        }
      );


    document
      .getElementById(
        "resetFilters"
      )
      .addEventListener(
        "click",
        () => {

          brightness = 100;

          contrast = 100;

          grayscale = 0;

          blur = 0;

          drawImage();

        }
      );

  }


  if (tool === "transform") {

    document
      .getElementById(
        "rotateLeft"
      )
      .addEventListener(
        "click",
        () => {

          rotation -= 90;

          drawImage();

          saveHistory();

        }
      );


    document
      .getElementById(
        "rotateRight"
      )
      .addEventListener(
        "click",
        () => {

          rotation += 90;

          drawImage();

          saveHistory();

        }
      );


    document
      .getElementById(
        "flipHorizontal"
      )
      .addEventListener(
        "click",
        () => {

          flipX *= -1;

          drawImage();

          saveHistory();

        }
      );


    document
      .getElementById(
        "flipVertical"
      )
      .addEventListener(
        "click",
        () => {

          flipY *= -1;

          drawImage();

          saveHistory();

        }
      );

  }


  if (tool === "crop") {

    document
      .getElementById(
        "squareCrop"
      )
      .addEventListener(
        "click",
        () => {

          const size =
            Math.min(
              Number(widthInput.value),
              Number(heightInput.value)
            );

          widthInput.value =
            size;

          heightInput.value =
            size;

          drawImage();

          saveHistory();

        }
      );


    document
      .getElementById(
        "landscapeCrop"
      )
      .addEventListener(
        "click",
        () => {

          const width =
            Number(widthInput.value);

          widthInput.value =
            width;

          heightInput.value =
            Math.round(
              width * 9 / 16
            );

          drawImage();

          saveHistory();

        }
      );


    document
      .getElementById(
        "portraitCrop"
      )
      .addEventListener(
        "click",
        () => {

          const height =
            Number(heightInput.value);

          heightInput.value =
            height;

          widthInput.value =
            Math.round(
              height * 9 / 16
            );

          drawImage();

          saveHistory();

        }
      );

  }


  if (tool === "watermark") {

    document
      .getElementById(
        "addWatermark"
      )
      .addEventListener(
        "click",
        () => {

          const text =
            document.getElementById(
              "watermarkText"
            ).value.trim();


          if (!text) {
            return;
          }


          drawImage();


          ctx.save();

          ctx.font =
            "bold 30px Arial";

          ctx.fillStyle =
            "rgba(255,255,255,.85)";

          ctx.textAlign =
            "right";

          ctx.fillText(
            text,
            canvas.width - 30,
            canvas.height - 30
          );

          ctx.restore();


          updateExportPreview();

          saveHistory();

        }
      );

  }


  if (tool === "slug") {

    document
      .getElementById(
        "applySlug"
      )
      .addEventListener(
        "click",
        () => {

          const text =
            document.getElementById(
              "slugText"
            ).value.trim();


          if (text) {

            fileNameInput.value =
              slugify(text);

          }

        }
      );

  }


  if (tool === "draw") {

    setupDrawing();

  }

}


/* DRAWING */

let drawing = false;

let drawColor = "#ff0000";

let brushSize = 5;


function setupDrawing() {

  const color =
    document.getElementById(
      "drawColor"
    );

  const size =
    document.getElementById(
      "brushSize"
    );


  color.addEventListener(
    "input",
    (e) => {

      drawColor =
        e.target.value;

    }
  );


  size.addEventListener(
    "input",
    (e) => {

      brushSize =
        Number(e.target.value);

    }
  );


  canvas.onpointerdown =
    (e) => {

      drawing = true;

      canvas.setPointerCapture(
        e.pointerId
      );

      const point =
        getCanvasPoint(e);

      ctx.beginPath();

      ctx.moveTo(
        point.x,
        point.y
      );

    };


  canvas.onpointermove =
    (e) => {

      if (!drawing) {
        return;
      }


      const point =
        getCanvasPoint(e);


      ctx.lineTo(
        point.x,
        point.y
      );


      ctx.strokeStyle =
        drawColor;


      ctx.lineWidth =
        brushSize;


      ctx.lineCap =
        "round";


      ctx.stroke();

    };


  canvas.onpointerup =
    () => {

      drawing = false;

      saveHistory();

    };

}


function getCanvasPoint(event) {

  const rect =
    canvas.getBoundingClientRect();


  return {

    x:
      (
        event.clientX -
        rect.left
      ) *
      (
        canvas.width /
        rect.width
      ),

    y:
      (
        event.clientY -
        rect.top
      ) *
      (
        canvas.height /
        rect.height
      )

  };

}


/* ZOOM */

document
  .getElementById("zoomIn")
  .addEventListener(
    "click",
    () => {

      zoom =
        Math.min(
          zoom + .1,
          3
        );

      updateZoom();

    }
  );


document
  .getElementById("zoomOut")
  .addEventListener(
    "click",
    () => {

      zoom =
        Math.max(
          zoom - .1,
          .2
        );

      updateZoom();

    }
  );


document
  .getElementById("fitBtn")
  .addEventListener(
    "click",
    () => {

      zoom = 1;

      updateZoom();

    }
  );


function updateZoom() {

  canvas.style.transform =
    `scale(${zoom})`;

  zoomValue.textContent =
    `${Math.round(zoom * 100)}%`;

}


/* BACKGROUND */

document
  .getElementById("backgroundBtn")
  .addEventListener(
    "click",
    () => {

      document
        .querySelector(
          '[data-tool="background"]'
        )
        .click();

    }
  );


/* EXPORT */

document
  .getElementById("exportTopBtn")
  .addEventListener(
    "click",
    openExport
  );


document
  .getElementById("downloadTopBtn")
  .addEventListener(
    "click",
    openExport
  );


function openExport() {

  if (!originalImage) {

    alert(
      "Please select an image first."
    );

    return;

  }


  exportModal.classList.remove(
    "hidden"
  );


  const originalFormat =
    getOriginalFormat();


  fromFormat.textContent =
    originalFormat;


  exportFormat.value =
    "original";


  updateFormatDisplay();


  const baseName =
    originalFile.name
      .replace(
        /\.[^/.]+$/,
        ""
      );


  fileNameInput.value =
    baseName;


  compressSlider.value =
    90;


  compressValue.textContent =
    "90%";


  updateCurrentSize();

  updateExportPreview();

}


/* CLOSE */

document
  .getElementById("closeModal")
  .addEventListener(
    "click",
    closeExport
  );


exportModal.addEventListener(
  "click",
  (event) => {

    if (
      event.target ===
      exportModal
    ) {

      closeExport();

    }

  }
);


function closeExport() {

  exportModal.classList.add(
    "hidden"
  );

}


/* FORMAT */

exportFormat.addEventListener(
  "change",
  () => {

    updateFormatDisplay();

    updateCurrentSize();

    updateExportPreview();

  }
);


function updateFormatDisplay() {

  let format =
    exportFormat.value;


  if (format === "original") {

    format =
      getOriginalMime();

  }


  const name =
    mimeName(format);


  toFormat.textContent =
    name;


  extension.textContent =
    "." +
    extensionName(format);

}


/* COMPRESSION */

compressSlider.addEventListener(
  "input",
  () => {

    compressValue.textContent =
      compressSlider.value +
      "%";

    updateCurrentSize();

  }
);


document
  .getElementById("resetCompress")
  .addEventListener(
    "click",
    () => {

      compressSlider.value =
        90;

      compressValue.textContent =
        "90%";

      updateCurrentSize();

    }
  );


/* MAX SIZE */

maxSizeInput.addEventListener(
  "input",
  () => {

    updateCurrentSize();

  }
);


sizeUnit.addEventListener(
  "change",
  updateCurrentSize
);


function updateCurrentSize() {

  if (!originalImage) {
    return;
  }


  const blob =
    createExportBlob(
      false
    );


  if (!blob) {
    return;
  }


  currentSize.textContent =
    formatBytes(
      blob.size
    );

}


/* EXPORT PREVIEW */

function updateExportPreview() {

  if (!originalImage) {
    return;
  }


  exportCanvas.width =
    canvas.width;

  exportCanvas.height =
    canvas.height;


  exportCtx.clearRect(
    0,
    0,
    exportCanvas.width,
    exportCanvas.height
  );


  exportCtx.drawImage(
    canvas,
    0,
    0
  );

}


/* ACTUAL EXPORT */

document
  .getElementById("exportNow")
  .addEventListener(
    "click",
    async () => {

      if (!originalImage) {
        return;
      }


      const format =
        getSelectedFormat();


      let targetBytes =
        null;


      if (
        maxSizeInput.value
      ) {

        const amount =
          Number(
            maxSizeInput.value
          );


        targetBytes =
          sizeUnit.value === "MB"
            ? amount * 1024 * 1024
            : amount * 1024;

      }


      let blob =
        await compressToTarget(
          format,
          targetBytes
        );


      if (!blob) {

        alert(
          "Could not create the image."
        );

        return;

      }


      const name =
        fileNameInput.value.trim() ||
        "image";


      const finalName =
        `${slugify(name)}.${extensionName(format)}`;


      downloadBlob(
        blob,
        finalName
      );


      closeExport();

    }
  );


/* GET FORMAT */

function getSelectedFormat() {

  if (
    exportFormat.value ===
    "original"
  ) {

    return getOriginalMime();

  }


  return exportFormat.value;

}


function getOriginalMime() {

  return originalFile.type;

}


function getOriginalFormat() {

  return mimeName(
    getOriginalMime()
  );

}


function mimeName(mime) {

  if (
    mime === "image/png"
  ) {
    return "PNG";
  }


  if (
    mime === "image/webp"
  ) {
    return "WEBP";
  }


  return "JPEG";

}


function extensionName(mime) {

  if (
    mime === "image/png"
  ) {
    return "png";
  }


  if (
    mime === "image/webp"
  ) {
    return "webp";
  }


  return "jpg";

}


/* CREATE BLOB */

function createExportBlob(
  useTarget
) {

  const format =
    getSelectedFormat();


  let quality =
    Number(
      compressSlider.value
    ) / 100;


  /*
    PNG ignores quality in browsers.
  */


  return canvasToBlob(
    canvas,
    format,
    quality
  );

}


function canvasToBlob(
  sourceCanvas,
  format,
  quality
) {

  return new Promise(
    (resolve) => {

      sourceCanvas.toBlob(
        (blob) => {

          resolve(blob);

        },
        format,
        quality
      );

    }
  );

}


/* TARGET SIZE COMPRESSION */

async function compressToTarget(
  format,
  targetBytes
) {

  /*
    If no target is entered,
    normal quality is used.
  */

  if (!targetBytes) {

    return await canvasToBlob(
      canvas,
      format,
      Number(
        compressSlider.value
      ) / 100
    );

  }


  let low = 0.05;

  let high = 1;

  let best = null;


  /*
    First try quality only.
  */

  for (
    let i = 0;
    i < 14;
    i++
  ) {

    const quality =
      (
        low +
        high
      ) / 2;


    const blob =
      await canvasToBlob(
        canvas,
        format,
        quality
      );


    if (
      blob.size >
      targetBytes
    ) {

      high =
        quality;

    } else {

      best =
        blob;

      low =
        quality;

    }

  }


  /*
    If target is extremely small,
    reduce image dimensions.
  */

  if (
    !best ||
    best.size >
    targetBytes
  ) {

    const originalCanvas =
      document.createElement(
        "canvas"
      );


    const tempCtx =
      originalCanvas.getContext(
        "2d"
      );


    let width =
      canvas.width;

    let height =
      canvas.height;


    for (
      let i = 0;
      i < 15;
      i++
    ) {

      width =
        Math.round(
          width * .9
        );


      height =
        Math.round(
          height * .9
        );


      originalCanvas.width =
        width;

      originalCanvas.height =
        height;


      tempCtx.clearRect(
        0,
        0,
        width,
        height
      );


      tempCtx.drawImage(
        canvas,
        0,
        0,
        width,
        height
      );


      best =
        await canvasToBlob(
          originalCanvas,
          format,
          .5
        );


      if (
        best.size <=
        targetBytes
      ) {

        break;

      }

    }

  }


  return best;

}


/* DOWNLOAD */

function downloadBlob(
  blob,
  filename
) {

  const url =
    URL.createObjectURL(
      blob
    );


  const link =
    document.createElement(
      "a"
    );


  link.href =
    url;

  link.download =
    filename;


  document.body.appendChild(
    link
  );


  link.click();


  link.remove();


  setTimeout(
    () => {

      URL.revokeObjectURL(
        url
      );

    },
    1000
  );

}


/* RESET */

function resetEditor() {

  rotation = 0;

  flipX = 1;

  flipY = 1;

  brightness = 100;

  contrast = 100;

  grayscale = 0;

  blur = 0;

  backgroundColor =
    "transparent";

  zoom = 1;


  widthInput.value =
    originalWidth;

  heightInput.value =
    originalHeight;


  drawImage();

  updateZoom();

}


/* RESET BUTTON */

document
  .getElementById("resetBtn")
  .addEventListener(
    "click",
    () => {

      resetEditor();

      saveHistory();

    }
  );


document
  .getElementById("panelReset")
  .addEventListener(
    "click",
    () => {

      resetEditor();

    }
  );


/* HISTORY */

function saveHistory() {

  /*
    Keep lightweight history.
  */

  try {

    const state =
      canvas.toDataURL(
        "image/png"
      );


    history =
      history.slice(
        0,
        historyIndex + 1
      );


    history.push(
      state
    );


    historyIndex =
      history.length - 1;


    if (
      history.length > 10
    ) {

      history.shift();

      historyIndex--;

    }

  } catch (error) {

    console.log(error);

  }

}


document
  .getElementById("undoBtn")
  .addEventListener(
    "click",
    () => {

      if (
        historyIndex <= 0
      ) {

        return;

      }


      historyIndex--;

      restoreHistory(
        history[historyIndex]
      );

    }
  );


document
  .getElementById("redoBtn")
  .addEventListener(
    "click",
    () => {

      if (
        historyIndex >=
        history.length - 1
      ) {

        return;

      }


      historyIndex++;

      restoreHistory(
        history[historyIndex]
      );

    }
  );


function restoreHistory(data) {

  const image =
    new Image();


  image.onload =
    () => {

      canvas.width =
        image.width;

      canvas.height =
        image.height;


      ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
      );


      ctx.drawImage(
        image,
        0,
        0
      );


      widthInput.value =
        image.width;

      heightInput.value =
        image.height;


      updateExportPreview();

    };


  image.src =
    data;

}


/* FULLSCREEN */

document
  .getElementById("fullscreenBtn")
  .addEventListener(
    "click",
    () => {

      const editor =
        document.querySelector(
          ".editor-app"
        );


      if (
        !document.fullscreenElement
      ) {

        editor.requestFullscreen();

      } else {

        document.exitFullscreen();

      }

    }
  );


/* DARK MODE */

function toggleDark() {

  document.body.classList.toggle(
    "dark"
  );

}


document
  .getElementById("themeBtn")
  .addEventListener(
    "click",
    toggleDark
  );


document
  .getElementById("darkEditorBtn")
  .addEventListener(
    "click",
    toggleDark
  );


/* SLUG */

function slugify(text) {

  return text
    .toLowerCase()
    .trim()
    .replace(
      /[^a-z0-9]+/g,
      "-"
    )
    .replace(
      /^-+|-+$/g,
      ""
    );

}


/* BYTES */

function formatBytes(bytes) {

  if (!bytes) {
    return "0 KB";
  }


  if (
    bytes <
    1024
  ) {

    return (
      bytes +
      " Bytes"
    );

  }


  if (
    bytes <
    1024 * 1024
  ) {

    return (
      (bytes / 1024)
        .toFixed(1) +
      " KB"
    );

  }


  return (
    (bytes / 1024 / 1024)
      .toFixed(2) +
    " MB"
  );

}
