"use strict";
let counter = 0;
//#region getKeys
var wKey = config.weatherKey;
var gKey = config.geoKey;
//#endregion

//#region SpeechRecognition - Web Speech API
window.SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

const mirraInput = new window.SpeechRecognition();
mirraInput.interimResults = true;
mirraInput.continuous = false;
// mirraInput.start();
//#endregion

//#region mirraMind
const startMirra = function () {
  // mirraInput.start();
  stopMirra();
  console.log(`startInput ${counter}:`, mirraInput.start());
  counter++;
};
const stopMirra = function () {
  console.log("stopInput:", mirraInput.abort());
};

//---------------------------------------------
//--Get Results
//---------------------------------------------
mirraInput.addEventListener("result", (e) => {
  let finalText = "";
  const recogResults = Array.from(e.results)
    .map((result) => result[0])
    .map((result) => result.transcript)
    .join("");
  console.log("interim: ", recogResults);

  // e.results[0].isFinal ? (finalText = text) : (finalText = "");
  if (e.results[0].isFinal) {
    finalText = recogResults;
    console.log("Final: ", finalText);
    //---------------------------------------------
    //--Recognition ==> API calls
    //---------------------------------------------
    if (!responsiveVoice.isPlaying()) {
      if (finalText == "what phase is the moon") {
        getMoonPhase();
        mirraInput.abort();
      }
      if (finalText == "how's the weather") {
        getCurrentWeather();
        mirraInput.abort();
      }
      if (finalText == `what's the date and time`) {
        mirraInput.abort();
        getCurrentTime();
      }
      if (finalText == `read the text`) {
        readInput();
        mirraInput.abort();
      }
    }
    finalText = "";
    //---------------------------------------------
  }
});
//---------------------------------------------
//#endregion

//#region responsiveVoice Parameters
let rvParameters = {
  // voice: "French Woman",
  onstart: stopMirra,
  onend: startMirra,
};
//#endregion
//#region Location Data

//#region "Mic Check"

navigator.permissions.query({ name: "microphone" }).then((permissionStatus) => {
  if (permissionStatus.state === "granted") {
    console.log("Mic Check: PASSED!");
  } else if (permissionStatus.state === "prompt") {
    console.log("Throw prompt!");
  } else if (permissionStatus.state === "denied") {
    console.log("Mic Check: DENIED!");
  }
});

// navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
//   console.log(stream);
// });

//#endregion
let clientZip = 84118;
responsiveVoice.speak(
  `Please wait while I get your location.`,
  "UK English Female",
  rvParameters
);
const hasLocation = (position) => {
  console.log("postion", position.coords);
  var requestOptions = {
    method: "GET",
  };
  let clientLatitude = position.coords.latitude || "45";
  let clientLongitude = position.coords.longitude || "-110";

  fetch(
    `https://api.geoapify.com/v1/geocode/reverse?lat=${clientLatitude}&lon=${clientLongitude}&format=json&apiKey=${gKey}`,
    requestOptions
  )
    .then((response) => response.json())
    .then((result) => {
      clientZip = result["results"][0].postcode;
      console.log(clientZip);
      startMirra();
    })
    .catch((error) => console.log("error", error));
};
const noLocation = (error) => {
  responsiveVoice.speak(
    `I apologize, it looks as if i can not see your location.`,
    "UK English Female",
    { rate: 1.1 }
  );
};
const geo = navigator.geolocation;
console.log("Get Locale:", geo.getCurrentPosition(hasLocation, noLocation));

//#endregion

const apiButton = document.querySelector(".APIButton");
apiButton.addEventListener("click", () => {
  console.log("clicked");
  getCurrentWeather();
});

const getMoonPhase = () => {
  let date = new Date();
  console.log(date);
  console.log(date.getFullYear());
  console.log(date.getMonth() + 1);
  console.log(date.getDate());

  var getDT = (function () {
    return `${date.getFullYear()}-${
      date.getMonth() < 10 ? "0" + (date.getMonth() + 1) : date.getMonth() + 1
    }-${date.getDate() < 10 ? "0" + date.getDate() : date.getDate()}`;
  })();
  console.log(getDT);

  let astroRequest = {
    q: clientZip,
    dt: getDT,
  };
  console.log(astroRequest);
  let astroURL = `http://api.weatherapi.com/v1/astronomy.json?key=${wKey}&q=${astroRequest.q}&dt=${astroRequest.dt}`;
  fetch(astroURL)
    .then((response) => response.json())
    .then((result) => {
      console.log(result);
      let moonPhase = result["astronomy"]["astro"]["moon_phase"];
      let moonRise = result["astronomy"]["astro"]["moonrise"];
      let moonSet = result["astronomy"]["astro"]["moonset"];
      console.log(moonRise);
      const thumb = document.querySelector(".thumb");
      const prompts = document.querySelector(".promptsSection");
      const buttons = document.querySelector(".buttonSection");
      thumb.src = `Thumbs/${moonPhase}.png`;
      thumb.style.opacity = "1";
      thumb.style.visibility = "visible";
      thumb.style.scale = "1";
      prompts.style.scale = "0";
      prompts.style.opacity = "0";
      // prompts.style.display = "none";
      prompts.style.visibility = "hidden";
      buttons.style.scale = "0";
      buttons.style.opacity = "0";
      buttons.style.visibility = "hidden";
      setTimeout(() => {
        prompts.style.opacity = "1";
        prompts.style.visibility = "visible";
        // prompts.style.display = "flex";
        thumb.style.scale = "0";
        prompts.style.scale = "1";
        thumb.style.opacity = "0";
        thumb.style.visibility = "hidden";
        buttons.style.opacity = "1";
        buttons.style.visibility = "visible";
        buttons.style.scale = "1";
      }, 10000);
      responsiveVoice.speak(
        `${
          moonRise == "No moonrise"
            ? "The moon has already risen"
            : `The moon rises tonight at ${moonRise}`
        }, and will set at ${moonSet}. The current phase of the moon is ${moonPhase}.`,
        "UK English Female",
        rvParameters
      );
    });
};

const getCurrentWeather = () => {
  let weatherURL = `http://api.weatherapi.com/v1/forecast.json?key=${wKey}&q=${"84074"}&days=1&aqi=yes&alerts=no`;
  fetch(weatherURL)
    .then((response) => response.json())
    .then((result) => {
      console.log(result);
      let currentConditions = `${result["current"]["condition"]["text"]}`;
      let currentTempF = `${result["current"]["temp_f"]}`;
      let currentTempC = `${result["current"]["temp_c"]}`;
      let currentWindMPH = `${result["current"]["wind_mph"]}`;
      let imgSrc = `${result["forecast"]["forecastday"][0]["day"]["condition"]["icon"]}`;
      console.log("imgSrc:", imgSrc);
      const thumb = document.querySelector(".thumb");
      const prompts = document.querySelector(".promptsSection");
      const buttons = document.querySelector(".buttonSection");
      thumb.src = `${imgSrc}`;
      thumb.style.opacity = "1";
      thumb.style.visibility = "visible";
      thumb.style.scale = "4";
      styleHidden(buttons);
      styleHidden(prompts);
      setTimeout(() => {
        styleVisible(prompts);
        styleVisible(buttons);
        styleHidden(thumb);
      }, 12000);
      // let moonPhase = result["astronomy"]["astro"]["moon_phase"];

      console.log("Conditions:", currentConditions);
      responsiveVoice.speak(
        `Today conditions look ${currentConditions} with a temperature of ${currentTempF} degrees Fahrenheit or ${currentTempC} degrees Celsius with a wind speed of ${currentWindMPH}  miles per hour`,
        "UK English Female",
        rvParameters
      );
    })
    .catch(() => {
      console.log("Broken");
      responsiveVoice.speak(
        `An error occurred on feedback, check console`,
        "UK English Female",
        rvParameters
      );
    });
};

const getCurrentTime = () => {
  let date = new Date();
  function dayOfTheWeek() {
    console.log(date.getDay());
    switch (date.getDay()) {
      case 0:
        return "sunday";
      case 1:
        return "monday";
      case 2:
        return "tuesday";
      case 3:
        return "wednesday";
      case 4:
        return "thursday";
      case 5:
        return "friday";
      case 6:
        return "saturday";
      default:
        return `It is day number ${date.getDay()}`;
    }
  }

  function monthOfTheYear() {
    switch (date.getMonth()) {
      case 0:
        return "january";
      case 1:
        return "february";
      case 2:
        return "march";
      case 3:
        return "april";
      case 4:
        return "may";
      case 5:
        return "june";
      case 6:
        return "july";
      case 7:
        return "august";
      case 8:
        return "septemper";
      case 9:
        return "october";
      case 10:
        return "november";
      case 11:
        return "december";
      default:
        return `It is the ${getNumSuffix(date.getMonth())} month of the year `;
    }
  }
  const getTimeFrom = (date) => {
    return `${date.getHours()} ${
      date.getMinutes() < 10 ? "O" + date.getMinutes() : date.getMinutes()
    }`;
  };
  console.log(getTimeFrom(date));

  const getNumSuffix = (num) => {
    if (num > 3 && num < 21) return `${num}th`;
    switch (num % 10) {
      case 1:
        return `${num}st`;
      case 2:
        return `${num}nd`;
      case 3:
        return `${num}rd`;
      default:
        return `${num}th`;
    }
  };

  let returnString = `Today is ${dayOfTheWeek()} ${monthOfTheYear()} ${getNumSuffix(
    date.getDate()
  )} It is currently ${getTimeFrom(date)} ${
    date.getHours() > 12 ? "P M" : "A M"
  }`;
  responsiveVoice.speak(returnString, "UK English Female", rvParameters);
};

const readInput = () => {
  responsiveVoice.speak(textArea.value, `${voices[31].name}`, { rate: 1 });
};

mirraInput.addEventListener("end", () => {
  var checkIsPlaying = setInterval(function () {
    if (!responsiveVoice.isPlaying()) {
      console.log("false", responsiveVoice.isPlaying());
      clearInterval(checkIsPlaying);
      stopMirra();
      startMirra();
      console.log("Done Playing");
    } else {
      stopMirra();
      console.log("Playing");
    }
  }, 2000);
});

//#region Textarea input

const voices = responsiveVoice.getVoices();
console.log(`"${voices[29]}"`);
console.log(voices);
let frenchFemale = `${voices[29].name}`;
let frenchVoice = "French Female";
console.log(frenchFemale);
console.log(frenchVoice);
const textArea = document.querySelector("textarea");
const inputButton = document.querySelector(".readInputButton");

inputButton.addEventListener("click", () => {
  responsiveVoice.speak(textArea.value, `${voices[31].name}`, { rate: 1 });
  console.log(textArea.value);
});

// `'${voices[29].name}'`

//#endregion

// const thumb = document.querySelector(".thumb");
// const prompts = document.querySelector(".promptsSection");

// if (thumb.style.visibility == "hidden") {
//   prompts.style.visibility = "visible";
//   prompts.style.opacity = "1";
// } else {
//   prompts.style.visibility = "hidden";
//   prompts.style.opacity = "0";
// }

const styleVisible = (obj) => {
  obj.style.opacity = "1";
  obj.style.visibility = "visible";
  obj.style.scale = "1";
};

const styleHidden = (obj) => {
  obj.style.opacity = "0";
  obj.style.visibility = "hidden";
  obj.style.scale = "0";
};
