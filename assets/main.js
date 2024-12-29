const renderedImages = [];

// Format bytes to their appropriate units
function formatBytes(bytes) {
	const units = ["Bytes", "KB", "MB", "GB", "TB"];
	let index = 0;

	while (bytes >= 1024 && index < units.length - 1) {
		bytes /= 1024;
		index++;
	}

	return `${bytes.toFixed(2)}${units[index]}`;
}

// Format time
function formatDate(dateString) {
	const date = new Date(dateString);

	const day = date.getDate();
	const month = date.toLocaleString("default", { month: "short" });
	const year = date.getFullYear();

	return `${day} ${month}, ${year}`;
}

// Reset upload either after a successful upload or before a successful upload
const resetForm = () => {
	document
		.getElementById("downloadAllBtn")
		.classList.replace("flex", "hidden");

	const fileInput = document.getElementById("pdfFile");
	fileInput.value = "";

	const uploadFileNameText = document.querySelector(".uploadFileName");
	const uploadForm = document.querySelector("#uploadForm");
	const pdfTitleContainer = document.querySelector(".document-name");

	uploadFileNameText.textContent = "";
	pdfTitleContainer.textContent = "";
	uploadForm.classList.replace("hidden", "flex");
};

document.querySelector(".resetUpload").addEventListener("click", () => {
	const successContainer = document.querySelector(".successContainer");
	successContainer.classList.replace("flex", "hidden");

	resetForm();
});

document.querySelector(".uploadResetBtn").addEventListener("click", () => {
	const uploadProgressContainer = document.querySelector(
		".uploadProgressContainer",
	);
	uploadProgressContainer.classList.replace("flex", "hidden");

	resetForm();
});

document.querySelector(".resetErrorBtn").addEventListener("click", () => {
	const errorContainer = document.querySelector(".errorContainer");
	errorContainer.classList.replace("flex", "hidden");

	resetForm();
});

// Get the file name
const fileInput = document.getElementById("pdfFile");

fileInput.addEventListener("change", (event) => {
	const files = event.target.files;

	const uploadFileNameText = document.querySelector(".uploadFileName");

	uploadFileNameText.textContent = "";

	if (files.length > 0) {
		uploadFileNameText.textContent = files[0].name;
	} else {
		uploadFileNameText.textContent = "";
	}
});

document
	.getElementById("uploadForm")
	.addEventListener("submit", async (event) => {
		event.preventDefault();

		const pdfFile = document.getElementById("pdfFile").files[0];
		const errorContainer = document.querySelector(".errorContainer");
		const errorMessage = document.querySelector(".errorMessage");
		const errorFileName = document.querySelector(".errorFileName");
		const fileTooLarge = document.querySelector(".fileTooLarge");
		const uploadForm = document.querySelector("#uploadForm");

		if (!pdfFile) {
			uploadForm.classList.replace("flex", "hidden");

			errorContainer.classList.replace("hidden", "flex");
			errorFileName.textContent = "Please select a PDF file";
			errorMessage.textContent = "Please select a PDF file";

			return;
		}

		if (pdfFile.size >= 2147483648) {
			uploadForm.classList.replace("flex", "hidden");

			errorFileName.textContent = pdfFile.name;
			errorContainer.classList.replace("hidden", "flex");
			fileTooLarge.classList.replace("hidden", "flex");

			return;
		}

		const outputContainer = document.getElementById("output");
		const pdfTitleContainer = document.querySelector(".document-name");
		const progressContainer = document.querySelector(".progress");
		const progressContainerFileName =
			document.querySelector(".progressName");

		progressContainer.textContent = "Processing: 0%";

		try {
			pdfTitleContainer.textContent = pdfFile.name;
			progressContainerFileName.textContent = pdfFile.name;

			const typedArray = await fileToTypedArray(pdfFile);
			const pdf = await pdfjsLib.getDocument(typedArray).promise;

			outputContainer.innerHTML = "";

			await renderPDFPagesWithProgress(
				pdf,
				outputContainer,
				progressContainer,
				pdfFile.name,
				formatBytes(pdfFile.size),
				formatDate(new Date()),
			);
		} catch (error) {
			uploadForm.classList.replace("flex", "hidden");
			errorContainer.classList.replace("hidden", "flex");

			errorMessage.textContent = error;
			errorFileName.textContent = pdfFile.name;

			outputContainer.innerHTML = "";
			progressContainer.textContent = "";
		}
	});

async function fileToTypedArray(file) {
	return new Promise((resolve, reject) => {
		const fileReader = new FileReader();

		fileReader.onload = () => resolve(new Uint8Array(fileReader.result));

		fileReader.onerror = () => reject(fileReader.error);
		fileReader.readAsArrayBuffer(file);
	});
}

async function renderPDFPagesWithProgress(
	pdf,
	outputContainer,
	progressContainer,
	fileName,
	size,
	date,
) {
	const scale = 4;
	const progressBarContainer = document.querySelector(
		".uploadProgressContainer",
	);
	const successContainer = document.querySelector(".successContainer");
	const successFileName = document.querySelector(".successFileName");
	const successSize = document.querySelector(".successSize");
	const successDate = document.querySelector(".successDate");

	for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
		const page = await pdf.getPage(pageNumber);

		const canvas = document.createElement("canvas");
		const context = canvas.getContext("2d");
		const viewport = page.getViewport({ scale });

		canvas.width = viewport.width;
		canvas.height = viewport.height;

		await page.render({ canvasContext: context, viewport }).promise;

		const imageDataURL = canvas.toDataURL("image/jpeg", 1.0);

		appendImageToOutput(imageDataURL, pageNumber, outputContainer);

		const progressBar = document.querySelector(".progressBar");
		const uploadForm = document.querySelector("#uploadForm");

		uploadForm.classList.replace("flex", "hidden");
		progressBarContainer.classList.replace("hidden", "flex");

		const percentComplete = Math.round((pageNumber / pdf.numPages) * 100);

		progressBar.style.setProperty("--after-width", `${percentComplete}%`);
		progressContainer.textContent = `Processing: ${percentComplete}%`;
	}

	progressContainer.textContent = "Processing Complete!";

	setTimeout(() => {
		progressBarContainer.classList.replace("flex", "hidden");
		successContainer.classList.replace("hidden", "flex");

		successFileName.textContent = fileName;
		successSize.textContent = size;
		successDate.textContent = date;

		if (renderedImages.length > 0) {
			document
				.getElementById("downloadAllBtn")
				.classList.replace("hidden", "flex");
		} else {
			document
				.getElementById("downloadAllBtn")
				.classList.replace("flex", "hidden");
		}
	}, [2000]);
}

function appendImageToOutput(imageDataURL, pageNumber, outputContainer) {
	const img = document.createElement("img");
	img.src = imageDataURL;
	img.alt = `Page ${pageNumber}`;
	img.className = "w-full h-full object-cover object-center rounded-xl";

	const downloadLinkContainer = document.createElement("div");
	const downloadLink = document.createElement("a");
	const downloadLinkImage = document.createElement("img");

	downloadLinkImage.src = "./assets/img/download-all-icon.svg";
	downloadLink.href = imageDataURL;

	downloadLink.download = `Page-${pageNumber}.jpg`;

	downloadLinkContainer.className =
		"bg-black/60 backdrop-blur h-full grid place-content-center absolute inset-0 w-full rounded-xl opacity-0 group-hover:opacity-100";
	downloadLink.className =
		"bg-[#22bb29] text-white rounded-full p-4 hover:bg-[#22bb29]/80 hover:ring-1 ring-offset-2 hover:ring-[#22bb29]/80 animate-bounce";
	downloadLink.ariaLabel = "Download image";
	downloadLink.title = `Download page ${pageNumber}`;

	downloadLinkContainer.appendChild(downloadLink);
	downloadLink.appendChild(downloadLinkImage).className = "w-full h-auto";

	const container = document.createElement("div");
	container.className = "relative group rounded-xl h-[250px]";

	container.appendChild(img);

	container.appendChild(downloadLinkContainer);

	outputContainer.appendChild(container);

	renderedImages.push({
		dataURL: imageDataURL,
		fileName: `Page-${pageNumber}.jpg`,
	});
}

document
	.getElementById("downloadAllBtn")
	.addEventListener("click", async () => {
		const errorMessage = document.querySelector(".errorMessage");
		const errorFileName = document.querySelector(".errorFileName");
		const pdfTitleContainer = document.querySelector(".document-name");

		document.getElementById("downloadAllBtn").textContent =
			"Downloading images, please hold on...";

		if (renderedImages.length === 0) {
			errorFileName.textContent = pdfTitleContainer.textContent;
			errorMessage.textContent = "No image(s) to download";

			return;
		}

		const zip = new JSZip();
		const folder = zip.folder("Tinvo_PDF_Pages");

		renderedImages.forEach((image, index) => {
			folder.file(image.fileName, image.dataURL.split(",")[1], {
				base64: true,
			});
		});

		const zipBlob = await zip.generateAsync({ type: "blob" });
		const zipURL = URL.createObjectURL(zipBlob);

		const a = document.createElement("a");
		a.href = zipURL;
		a.download = "PDF_Pages.zip";
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);

		URL.revokeObjectURL(zipURL);

		document.getElementById("downloadAllBtn").textContent = "Download All";
	});
