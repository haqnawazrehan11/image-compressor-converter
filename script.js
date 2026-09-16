```javascript
const fileInput =
  document.getElementById("fileInput");

const dropArea =
  document.getElementById("dropArea");

const convertBtn =
  document.getElementById("convertBtn");

const clearBtn =
  document.getElementById("clearBtn");

const removeAllBtn =
  document.getElementById("removeAllBtn");

const formatSelect =
  document.getElementById("format");

const qualitySlider =
  document.getElementById("quality");

const qualityValue =
  document.getElementById("qualityValue");

const maxWidthInput =
  document.getElementById("maxWidth");

const targetSizeInput =
  document.getElementById("targetSize");

const previewSection =
  document.getElementById("previewSection");

const previewGrid =
  document.getElementById("previewGrid");

const resultsSection =
  document.getElementById("resultsSection");

const resultsContainer =
  document.getElementById("results");

const downloadAllBtn =
  document.getElementById("downloadAllBtn");


let selectedFiles = [];

let convertedFiles = [];


/* Quality Slider */

qualitySlider.addEventListener(
  "input",
  () => {

    qualityValue.textContent =
      qualitySlider.value;

  }
);


/* File Selection */

fileInput.addEventListener(
  "change",
  (event) => {

    addFiles(
      event.target.files
    );

  }
);


/* Drag & Drop */

[
  "dragenter",
  "dragover"
].forEach(
  (eventName) => {

    dropArea.addEventListener(
      eventName,
      (event) => {

        event.preventDefault();

        dropArea.classList.add(
          "dragover"
        );

      }
    );

  }
);


[
  "dragleave",
  "drop"
].forEach(
  (eventName) => {

    dropArea.addEventListener(
      eventName,
      (event) => {

        event.preventDefault();

        dropArea.classList.remove(
          "dragover"
        );

      }
    );

  }
);


dropArea.addEventListener(
  "drop",
  (event) => {

    addFiles(
      event.dataTransfer.files
    );

  }
);


/* Add Images */

function addFiles(files) {

  const imageFiles =
    Array.from(files).filter(
      (file) => {

        return [
          "image/jpeg",
          "image/png",
          "image/webp"
        ].includes(
          file.type
        );

      }
    );


  selectedFiles = [
    ...selectedFiles,
    ...imageFiles
  ];


  renderPreviews();


  convertBtn.disabled =
    selectedFiles.length === 0;

}


/* Image Previews */

function renderPreviews() {

  previewGrid.innerHTML = "";


  if (!selectedFiles.length) {

    previewSection.classList.add(
      "hidden"
    );

    return;

  }


  previewSection.classList.remove(
    "hidden"
  );


  selectedFiles.forEach(
    (file, index) => {

      const item =
        document.createElement(
          "div"
        );


      item.className =
        "preview-item";


      const imageURL =
        URL.createObjectURL(
          file
        );


      item.innerHTML = `

        <img
          src="${imageURL}"
          alt="${escapeHTML(file.name)}"
        >

        <div class="preview-name">
          ${escapeHTML(file.name)}
        </div>

        <button
          class="remove-image"
          title="Remove image"
        >
          ×
        </button>

      `;


      item
        .querySelector(
          ".remove-image"
        )
        .addEventListener(
          "click",
          () => {

            URL.revokeObjectURL(
              imageURL
            );


            selectedFiles.splice(
              index,
              1
            );


            renderPreviews();


            convertBtn.disabled =
              selectedFiles.length === 0;

          }
        );


      previewGrid.appendChild(
        item
      );

    }
  );

}


/* Remove All */

removeAllBtn.addEventListener(
  "click",
  () => {

    selectedFiles = [];

    fileInput.value = "";

    renderPreviews();

    convertBtn.disabled = true;

  }
);


/* Convert */

convertBtn.addEventListener(
  "click",
  async () => {

    if (!selectedFiles.length) {
      return;
    }


    convertBtn.disabled = true;

    convertBtn.textContent =
      "Processing...";


    resultsContainer.innerHTML =
      "";


    convertedFiles = [];


    resultsSection.classList.remove(
      "hidden"
    );


    for (
      const file of selectedFiles
    ) {

      try {

        const converted =
          await processImage(file);


        convertedFiles.push(
          converted
        );


        displayResult(
          converted
        );


      } catch (error) {

        console.error(
          error
        );


        showError(
          file.name
        );

      }

    }


    convertBtn.disabled = false;

    convertBtn.textContent =
      "Convert & Compress";

  }
);


/* Process Image */

function processImage(file) {

  return new Promise(
    (resolve, reject) => {

      const reader =
        new FileReader();


      reader.onload =
        (event) => {

          const img =
            new Image();


          img.onload =
            async () => {

              let width =
                img.naturalWidth;


              let height =
                img.naturalHeight;


              const maxWidth =
                parseInt(
                  maxWidthInput.value
                );


              /*
                Resize image if
                Maximum Width is set.
              */

              if (
                maxWidth &&
                width > maxWidth
              ) {

                height =
                  Math.round(
                    height *
                    (
                      maxWidth /
                      width
                    )
                  );


                width =
                  maxWidth;

              }


              const canvas =
                document.createElement(
                  "canvas"
                );


              canvas.width =
                width;


              canvas.height =
                height;


              const ctx =
                canvas.getContext(
                  "2d"
                );


              const format =
                formatSelect.value;


              /*
                JPG does not support
                transparent backgrounds.
              */

              if (
                format ===
                "image/jpeg"
              ) {

                ctx.fillStyle =
                  "#ffffff";


                ctx.fillRect(
                  0,
                  0,
                  width,
                  height
                );

              }


              ctx.drawImage(
                img,
                0,
                0,
                width,
                height
              );


              /*
                Target KB
              */

              const targetKB =
                parseFloat(
                  targetSizeInput.value
                );


              /*
                If Target Size is empty,
                use normal quality.
              */

              if (!targetKB) {

                const quality =
                  Number(
                    qualitySlider.value
                  ) / 100;


                const blob =
                  await canvasToBlob(
                    canvas,
                    format,
                    quality
                  );


                finishConversion(
                  file,
                  blob,
                  format,
                  resolve,
                  reject
                );


                return;

              }


              /*
                Target bytes.
              */

              const targetBytes =
                targetKB * 1024;


              /*
                Find best quality
                using binary search.
              */

              let low =
                0.05;


              let high =
                1;


              let bestBlob =
                null;


              for (
                let i = 0;
                i < 12;
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

                  bestBlob =
                    blob;

                  low =
                    quality;

                }

              }


              /*
                If target is very small
                and quality alone cannot
                reach it, reduce dimensions.
              */

              if (
                !bestBlob ||
                bestBlob.size >
                targetBytes
              ) {

                let currentWidth =
                  width;


                let currentHeight =
                  height;


                for (
                  let i = 0;
                  i < 12;
                  i++
                ) {

                  currentWidth =
                    Math.round(
                      currentWidth *
                      0.9
                    );


                  currentHeight =
                    Math.round(
                      currentHeight *
                      0.9
                    );


                  canvas.width =
                    currentWidth;


                  canvas.height =
                    currentHeight;


                  const newCtx =
                    canvas.getContext(
                      "2d"
                    );


                  if (
                    format ===
                    "image/jpeg"
                  ) {

                    newCtx.fillStyle =
                      "#ffffff";


                    newCtx.fillRect(
                      0,
                      0,
                      currentWidth,
                      currentHeight
                    );

                  }


                  newCtx.drawImage(
                    img,
                    0,
                    0,
                    currentWidth,
                    currentHeight
                  );


                  const smallerBlob =
                    await canvasToBlob(
                      canvas,
                      format,
                      0.5
                    );


                  bestBlob =
                    smallerBlob;


                  if (
                    smallerBlob.size <=
                    targetBytes
                  ) {

                    break;

                  }

                }

              }


              /*
                Final conversion.
              */

              finishConversion(
                file,
                bestBlob,
                format,
                resolve,
                reject
              );

            };


          img.onerror =
            () => {

              reject(
                new Error(
                  "Invalid image"
                )
              );

            };


          img.src =
            event.target.result;

        };


      reader.onerror =
        () => {

          reject(
            new Error(
              "File reading failed"
            )
          );

        };


      reader.readAsDataURL(
        file
      );

    }
  );

}


/* Canvas to Blob */

function canvasToBlob(
  canvas,
  format,
  quality
) {

  return new Promise(
    (resolve) => {

      canvas.toBlob(
        (blob) => {

          resolve(
            blob
          );

        },
        format,
        quality
      );

    }
  );

}


/* Finish Conversion */

function finishConversion(
  file,
  blob,
  format,
  resolve,
  reject
) {

  if (!blob) {

    reject(
      new Error(
        "Conversion failed"
      )
    );

    return;

  }


  const extension =
    getExtension(
      format
    );


  const originalName =
    file.name.replace(
      /\.[^/.]+$/,
      ""
    );


  const newName =
    `${originalName}-converted.${extension}`;


  resolve({

    blob: blob,

    url:
      URL.createObjectURL(
        blob
      ),

    name:
      newName,

    originalSize:
      file.size,

    newSize:
      blob.size

  });

}


/* Extension */

function getExtension(
  format
) {

  if (
    format ===
    "image/webp"
  ) {

    return "webp";

  }


  if (
    format ===
    "image/png"
  ) {

    return "png";

  }


  return "jpg";

}


/* Display Result */

function displayResult(
  file
) {

  const savedPercent =
    file.originalSize > 0
      ? Math.round(
          (
            (
              file.originalSize -
              file.newSize
            ) /
            file.originalSize
          ) * 100
        )
      : 0;


  const card =
    document.createElement(
      "div"
    );


  card.className =
    "result-card";


  card.innerHTML = `

    <img
      src="${file.url}"
      alt="Converted image"
    >

    <div class="file-info">

      <h3>
        ${escapeHTML(file.name)}
      </h3>

      <p>
        Original:
        ${formatBytes(file.originalSize)}
        →
        New:
        ${formatBytes(file.newSize)}
      </p>

      <p class="${
        savedPercent > 0
          ? "success"
          : ""
      }">

        ${
          savedPercent > 0
            ? `${savedPercent}% smaller`
            : "Converted successfully"
        }

      </p>

    </div>

    <button
      class="download-btn"
    >
      Download
    </button>

  `;


  card
    .querySelector(
      ".download-btn"
    )
    .addEventListener(
      "click",
      () => {

        downloadFile(
          file.url,
          file.name
        );

      }
    );


  resultsContainer.appendChild(
    card
  );

}


/* Download All */

downloadAllBtn.addEventListener(
  "click",
  () => {

    if (
      !convertedFiles.length
    ) {

      return;

    }


    convertedFiles.forEach(
      (file, index) => {

        setTimeout(
          () => {

            downloadFile(
              file.url,
              file.name
            );

          },
          index * 300
        );

      }
    );

  }
);


/* Download */

function downloadFile(
  url,
  filename
) {

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

}


/* Format Bytes */

function formatBytes(
  bytes
) {

  if (bytes === 0) {

    return "0 Bytes";

  }


  const units = [
    "Bytes",
    "KB",
    "MB",
    "GB"
  ];


  const i =
    Math.floor(
      Math.log(bytes) /
      Math.log(1024)
    );


  return (
    parseFloat(
      (
        bytes /
        Math.pow(
          1024,
          i
        )
      ).toFixed(2)
    ) +
    " " +
    units[i]
  );

}


/* Error */

function showError(
  filename
) {

  const error =
    document.createElement(
      "div"
    );


  error.className =
    "result-card";


  error.innerHTML = `

    <div class="error">

      Could not process
      ${escapeHTML(filename)}

    </div>

  `;


  resultsContainer.appendChild(
    error
  );

}


/* Security */

function escapeHTML(
  text
) {

  const div =
    document.createElement(
      "div"
    );


  div.textContent =
    text;


  return div.innerHTML;

}


/* Clear All */

clearBtn.addEventListener(
  "click",
  () => {

    selectedFiles = [];


    convertedFiles.forEach(
      (file) => {

        URL.revokeObjectURL(
          file.url
        );

      }
    );


    convertedFiles = [];


    fileInput.value =
      "";


    resultsContainer.innerHTML =
      "";


    resultsSection.classList.add(
      "hidden"
    );


    renderPreviews();


    convertBtn.disabled =
      true;


    convertBtn.textContent =
      "Convert & Compress";

  }
);
```
