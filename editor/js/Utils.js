function readFileJSON(ev) {
	return new Promise((resolve, reject) => {
		const fileDom = ev.target,
			file = fileDom.files[0];

		if (file.type !== "application/json") {
			reject("Only supports uploading json file.");
		}

		if (typeof FileReader === "undefined") {
			reject("FileReader not support.");
		}

		ev.target.value = "";

		const reader = new FileReader();
		reader.readAsText(file);

		reader.onerror = (err) => {
			reject("Data parsing failed(1).", err);
		};

		reader.onload = () => {
			const resultData = reader.result;
			if (resultData) {
				try {
					const importData = JSON.parse(resultData);
					resolve(importData);
				}
				catch (error) {
					reject("Data parsing failed(2).", error);
				}
			}
		};
	});
}

export function exportFileJSON(data) {
	if (typeof data === "object") {
		data = JSON.stringify(data, null, 4);
	}
	const blob = new Blob([data], { type: "text/json" }),
		e = new MouseEvent("click"),
		a = document.createElement("a");

	a.download = "index.json";
	a.href = window.URL.createObjectURL(blob);
	a.dataset.downloadurl = ["text/json", a.download, a.href].join(":");
	a.dispatchEvent(e);
}

export function importFileJSON(callback) {
	const inputObj = document.createElement('input');
	inputObj.setAttribute('id', '_ef');
	inputObj.setAttribute('type', 'file');
	inputObj.setAttribute("style", 'visibility:hidden;height:0px');
	document.body.appendChild(inputObj);

	inputObj.click();

	inputObj.onchange = (event) => {
		readFileJSON(event)
			.then((res) => {
				console.log("import data:", res);
				callback(res);
			})
			.catch((err) => {
				console.log(err);
			});
	};

	document.body.removeChild(inputObj);
}