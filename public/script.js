const dropContainer = document.getElementById("form")
const fileInput = document.getElementById("audioFile")

document.getElementById("form").addEventListener('click', function (e) {
    e.stopPropagation();
    document.getElementById("audioFile").click(function (e) { e.stopPropagation(); });
});

document.getElementById('audioFile').addEventListener('change', function (event) {
    if (event.target.files[0]) {
        getAudioTranscript(event)
    }
});

dropContainer.addEventListener("drop", (e) => {
    e.preventDefault()
    fileInput.files = e.dataTransfer.files
    getAudioTranscript(e)
})

function displayTranscript(text) {
    document.getElementById("transcript-text").innerHTML = text
}

function displayLoadingMessage() {
    document.getElementById("transcript-text").innerHTML = "Loading (the machine is not powerful, it makes take some time)"
}

function removeLoadingMessage() {
    document.getElementById("transcript-text").innerHTML = ""
}

function removeErrorMessage() {
    document.getElementById("error-container").innerHTML = ""
}

function displayError(text) {
    document.getElementById("error-container").innerHTML = `<p id="error-message">${text}</p>`
}

async function handleError(response) {
    if (response.status === 413) {
        displayError('File is too large')
    }
    else {
        const error = await response.json().then(x => x.error)
        displayError(error ?? "An error occured")
    }
    removeLoadingMessage()
}

async function getAudioTranscript(event) {
    event.preventDefault();

    removeErrorMessage()

    const fileInput = document.querySelector('#audioFile');
    const audioFile = fileInput.files[0];

    const data = new FormData();
    data.append('audioFile', audioFile);

    displayLoadingMessage()

    const isLocalhost = location.hostname === "localhost"

    const url = isLocalhost ? "http://localhost:3000/audio" : "https://transcribeanyaudio.com/audio";

    try {
        const response = await fetch(url, {
            method: 'POST',
            body: data,
        });

        if (!response.ok) {
            await handleError(response)
            return;
        }

        const transcript = await response.json().then(x => x.transcript)

        displayTranscript(transcript)
    } catch (error) {
        console.error('Error uploading audio file:', error);
    }
}