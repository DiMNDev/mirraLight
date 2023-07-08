let date = new Date();
//#region getKeys
var wKey = config.weatherKey;
var gKey = config.geoKey;
//#endregion

//#region SpeechRecognition - Web Speech API
window.SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

const mirraInput = new window.SpeechRecognition();
mirraInput.interimResults = true;
//#endregion

//#region SpeechSynthesis - Web Speech API
window.SpeechSynthesis = window.speechSynthesis || window.webkitSpeechSynthesis;
const mirraSpeech = window.speechSynthesis;
//#endregion
//#region mirraMind
const startMirra = function () {
  console.log("startMirra");
  mirraInput.start();
  let finalText = "";
  //---------------------------------------------
  //--Get Results
  //---------------------------------------------
  mirraInput.addEventListener("result", (e) => {
    console.log(e.results);
    const text = Array.from(e.results)
      .map((result) => result[0])
      .map((result) => result.transcript)
      .join("");
    console.log(text);
    // e.results[0].isFinal ? (finalText = text) : (finalText = "");
    if (e.results[0].isFinal) {
      finalText = text;
      //---------------------------------------------
      //--Recognition ==> API calls
      //---------------------------------------------
      if (!mirraSpeech.speaking()) {
        if (finalText == "what phase is the moon") {
          getMoonPhase();
          mirraInput.abort();
        }
        if (finalText == "how's the weather") {
          getCurrentWeather();
          mirraInput.abort();
        }
        if (finalText == `${"what's" || "what is"} the date and time`) {
          getCurrentTime();
          mirraInput.abort();
        }
      }
      //---------------------------------------------
    }
  });
  //---------------------------------------------

  finalText = "";
};
const stopMirra = function () {
  mirraInput.abort();
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

mirraSpeech.speak(`Please wait while I get your location.`);
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
      console.log((clientZip = result["results"][0].postcode));
      console.log(clientZip);
      startMirra();
    })
    .catch((error) => console.log("error", error));
};
const noLocation = (error) => {
  mirraSpeech.speak(
    `I apologize, it looks as if i can not see your location.`,
    "UK English Female",
    { rate: 1.1 }
  );
};
const geo = navigator.geolocation;
console.log("Get Locale:", geo.getCurrentPosition(hasLocation, noLocation));

//#endregion

const button = document.querySelector(".button");
button.addEventListener("click", () => {
  console.log("clicked");
  getCurrentTime();
});

const getMoonPhase = () => {
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
      console.log(moonPhase);

      mirraSpeech.speak(
        `${
          moonRise == "No moonrise"
            ? "The moon has already risen"
            : `The moon rises tonight at ${moonRise}`
        } and will set at ${moonSet}. The current phase of the moon is ${moonPhase}.`,
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

      // let moonPhase = result["astronomy"]["astro"]["moon_phase"];

      console.log("Conditions:", currentConditions);
      mirraSpeech.speak(
        `Today conditions look ${currentConditions} with a temperature of ${currentTempF} degrees Fahrenheit or ${currentTempC} degrees Celsius with a wind speed of ${currentWindMPH}  miles per hour`,
        "UK English Female",
        rvParameters
      );
    })
    .catch(() => {
      console.log("Broken");
      mirraSpeech.speak(
        `An error occurred on feedback, check console`,
        "UK English Female",
        rvParameters
      );
    });
};

const getCurrentTime = () => {
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
    return `${date.getHours()} ${date.getMinutes()}`;
  };

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
  mirraSpeech.speak(
    `Today is ${dayOfTheWeek()} ${monthOfTheYear()} ${getNumSuffix(
      date.getDate()
    )} It is currently ${getTimeFrom(date)} ${
      date.getHours() > 12 ? "PM" : "AM"
    }`,
    "UK English Female",
    rvParameters
  );
};

mirraInput.addEventListener("end", () => {
  var checkIsPlaying = setInterval(function () {
    if (!mirraSpeech.speaking()) {
      console.log("false", mirraSpeech.speaking());
      clearInterval(checkIsPlaying);
      finalText = " ";
      startMirra();
      console.log("Done Playing");
    } else {
      mirraInput.abort();
      console.log("Playing");
    }
  }, 700);
});
