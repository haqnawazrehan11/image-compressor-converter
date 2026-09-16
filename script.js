const fileInput = document.getElementById("fileInput");
const dropArea = document.getElementById("dropArea");
const convertBtn = document.getElementById("convertBtn");
const clearBtn = document.getElementById("clearBtn");
const formatSelect = document.getElementById("format");
const qualitySlider = document.getElementById("quality");
const qualityValue = document.getElementById("qualityValue");
const maxWidthInput = document.getElementById("maxWidth");
const resultsSection = document.getElementById("resultsSection");
const resultsContainer = document.getElementById("results");
const downloadAllBtn = document.getElementById("downloadAllBtn");

let selectedFiles = [];
let convertedFiles = [];

qualitySlider.addEventListener("input", () => {
  qualityValue.textContent = qualitySlider.value;
});

fileInput.addEventListener("change", (event) => {
  addFiles(event.target.files);
});

["dragenter", "dragover"].forEach((eventName) => {
  dropArea.addEventListener(eventName, (e) => {
    e.preventDefault();
    dropArea.classList.add("dragover");
  });
});

["dragleave", "drop"].forEach((eventName) => {
  dropArea.addEventListener(eventName, (e) => {
    e.preventDefault();
    dropArea.classList.remove("dragover");
  });
});

dropArea.addEventListener("drop", (e) => {
  addFiles(e.dataTransfer.files);
});

function addFiles(files) {

  const imageFiles = Array.from(files).filter((file) =>
    [
      "image/jpeg",
      "image/png",
      "image/webp"
    ].includes(file.type)
  );

  selectedFiles = [
    ...selectedFiles,
    ...imageFiles
  ];

  convertBtn.disabled = selectedFiles.length === 0;

  if (selectedFiles.length > 0) {

    dropArea.querySelector("h2").textContent =
      `${selectedFiles.length} image(s) selected`;

  }
}

convertBtn.addEventListener("click", async () => {

  if (!selectedFiles.length) return;

  convertBtn.disabled = true;
  convertBtn.textContent = "Processing...";

  resultsContainer.innerHTML = "";
  convertedFiles = [];

  resultsSection.classList.remove("hidden");

  for (const file of selectedFiles) {

    try {

      const converted = await processImage(file);

      convertedFiles.push(converted);

      displayResult(converted);

    } catch (error) {

      console.error(error);

      const errorElement = document.createElement("div");

      errorElement.className = "result-card";

      errorElement.innerHTML = `
        <div class="error">
          Could not process ${escapeHTML(file.name)}
        </div>
      `;

      resultsContainer.appendChild(errorElement);
    }
  }

  convertBtn.disabled = false;
  convertBtn.textContent = "Convert & Compress";
});

function processImage(file) {

  return new Promise((resolve, reject) => {

    const reader = new FileReader();

    reader.onload = (event) => {

      const img = new Image();

      img.onload = () => {

        let width = img.naturalWidth;
        let height = img.naturalHeight;

        const maxWidth =
          parseInt(maxWidthInput.value);

        if (maxWidth && width > maxWidth) {

          height =
            Math.round(
              height * (maxWidth / width)
            );

          width = maxWidth;
        }

        const canvas =
          document.createElement("canvas");

        canvas.width = width;
        canvas.height = height;

        const ctx =
          canvas.getContext("2d");

        const format =
          formatSelect.value;

        if (format === "image/jpeg") {

          ctx.fillStyle = "#ffffff";

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

        const quality =
          Number(qualitySlider.value) / 100;

        canvas.toBlob(
          (blob) => {

            if (!blob) {

              reject(
                new Error("Conversion failed")
              );

              return;
            }

            const extension =
              getExtension(format);

            const originalName =
              file.name.replace(
                /\.[^/.]+$/,
                ""
              );

            const newName =
              `${originalName}-converted.${extension}`;

            resolve({

              originalFile: file,

              blob: blob,

              url: URL.createObjectURL(blob),

              name: newName,

              originalSize: file.size,

              newSize: blob.size

            });

          },
          format,
          quality
        );
      };

      img.onerror = () => {
        reject(new Error("Invalid image"));
      };

      img.src = event.target.result;
    };

    reader.onerror = () => {
      reject(new Error("File reading failed"));
    };

    reader.readAsDataURL(file);
  });
}

function getExtension(format) {

  if (format === "image/webp") {
    return "webp";
  }

  if (format === "image/png") {
    return "png";
  }

  return "jpg";
}

function displayResult(file) {

  const savedPercent =
    file.originalSize > 0
      ? Math.round(
          (
            (file.originalSize - file.newSize) /
            file.originalSize
          ) * 100
        )
      : 0;

  const card =
    document.createElement("div");

  card.className = "result-card";

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

      <p class="${savedPercent > 0 ? "success" : ""}">

        ${
          savedPercent > 0
            ? `${savedPercent}% smaller`
            : "Converted successfully"
        }

      </p>

    </div>

    <button class="download-btn">
      Download
    </button>
  `;

  const downloadButton =
    card.querySelector(".download-btn");

  downloadButton.addEventListener(
    "click",
    () => {
      downloadFile(
        file.url,
        file.name
      );
    }
  );

  resultsContainer.appendChild(card);
}

downloadAllBtn.addEventListener(
  "click",
  () => {

    if (!convertedFiles.length) return;

    convertedFiles.forEach(
      (file, index) => {

        setTimeout(() => {

          downloadFile(
            file.url,
            file.name
          );

        }, index * 300);

      }
    );
  }
);

function downloadFile(url, filename) {

  const link =
    document.createElement("a");

  link.href = url;
  link.download = filename;

  document.body.appendChild(link);

  link.click();

  link.remove();
}

function formatBytes(bytes) {

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
        Math.pow(1024, i)
      ).toFixed(2)
    ) +
    " " +
    units[i]
  );
}

function escapeHTML(text) {

  const div =
    document.createElement("div");

  div.textContent = text;

  return div.innerHTML;
}

clearBtn.addEventListener(
  "click",
  () => {

    selectedFiles = [];

    convertedFiles.forEach(
      (file) => {
        URL.revokeObjectURL(file.url);
      }
    );

    convertedFiles = [];

    resultsContainer.innerHTML = "";

    resultsSection.classList.add("hidden");

    fileInput.value = "";

    convertBtn.disabled = true;

    dropArea.querySelector("h2").textContent =
      "Upload Your Images";
  }
);
