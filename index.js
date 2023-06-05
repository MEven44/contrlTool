// bluetooth related

let returnValue = "";
let transmitCharacteristic = null;
const encoder = new TextEncoder("utf-8");
const decoder = new TextDecoder("utf8");

// counter buttons and functions

let inc_one_bttn = document.getElementsByClassName('plus_one');
let dec_one_bttn = document.getElementsByClassName("minus_one");
let inc_point_one_bttn = document.getElementsByClassName('plus_point_one');
let dec_point_one_bttn = document.getElementsByClassName("minus_point_one");
let inc_ten_bttn = document.getElementsByClassName('plus_ten')
let dec_ten_bttn = document.getElementsByClassName('minus_ten')

let counterFreq = document.getElementById("freq-input");
let counterTime = document.getElementById("time-input");
Fcount = 0;
Tcount = 0;



inc_one_bttn[0].addEventListener("click", function (e) {
    Fcount++
    counterFreq.textContent = Fcount
})

dec_one_bttn[0].addEventListener("click", (e)=>{
    Fcount--
    counterFreq.textContent = Fcount
})

inc_point_one_bttn[0].addEventListener("click", function (e) {
  Fcount = Fcount + 0.1;
  counterFreq.textContent = Fcount;
});

dec_point_one_bttn[0].addEventListener("click", (e) => {
  Fcount = Fcount - 0.1;
  counterFreq.textContent = Fcount;
});

inc_ten_bttn[0].addEventListener("click", function (e) {
  Fcount = Fcount + 10;
  counterFreq.textContent = Fcount;
});

dec_ten_bttn[0].addEventListener("click", (e) => {
  Fcount = Fcount - 10;
  counterFreq.textContent = Fcount;
});

function noLessThenZero(counterFreq) {
    if (counterFreq < 0) counterFreq = 0;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// do some logging
const Logger = {
  log: function () {
    var line = Array.prototype.slice
      .call(arguments)
      .map(function (argument) {
        return typeof argument === "string"
          ? argument
          : JSON.stringify(argument);
      })
      .join(" ");

    document.querySelector("#log").textContent += line + "\n";
  },
  clearLog: function () {
    document.querySelector("#log").textContent = "";
  },
};
const log = Logger.log;

function handleNotifications(event) {
  let value = event.target.value;
  const val = decoder.decode(value);
  log("return value = " + val);
  returnValue = val;
}

async function sendCommandAndWaitForResponse(
  characteristic,
  command,
  timeoutSec = 20
) {
  returnValue = "";

  const encodedData = encoder.encode(command);
  const value = await characteristic.writeValue(encodedData);

  for (let i = 0; i < timeoutSec; i++) {
    if (returnValue !== "") {
      return returnValue;
    }
    await sleep(1000);
  }
  return "";
}

async function waitForResponse(timeoutSec = 20) {
  returnValue = "";
  for (let i = 0; i < timeoutSec; i++) {
    if (returnValue !== "") {
      return returnValue;
    }
    await sleep(1000);
  }
  return "";
}

// connection to the iPulser bluetooth

async function connectAndTest() {
  // const characteristicUUID = "49535343-4c8a-39b3-2f49-511cff073b7e";
  const transmitCharacteristicUUID = "49535343-1e4d-4bd9-ba61-23c647249616";
  const receiveCharacteristicUUID = "49535343-8841-43f4-a8d4-ecbe34729bb3";
  // this is the transmit uart service
  const serviceUUID = "49535343-fe7d-4ae5-8fa9-9fafd205e455";

  const device = await navigator.bluetooth.requestDevice({
    filters: [{ namePrefix: "iPulser" }],
    optionalServices: [serviceUUID],
  });
  const server = await device.gatt.connect();
  const service = await server.getPrimaryService(serviceUUID);

  transmitCharacteristic = await service.getCharacteristic(
    transmitCharacteristicUUID
  );

  // const receiveCharacteristic = await service.getCharacteristic(receiveCharacteristicUUID);

  await transmitCharacteristic.startNotifications();

  transmitCharacteristic.addEventListener(
    "characteristicvaluechanged",
    handleNotifications
  );

  // send frequency command to device

  function inputs(freq, time) {
    console.log("frequency is:", freq, "time is:", time);
    let freqModify = Number.parseFloat(freq).toFixed(1);

    freqArray = freqModify.split("");
    takeAwayDot = freqArray.filter((num) => num !== ".");
    freqModify = takeAwayDot.join("").padStart(7, "0");

    let timeModify = Number.parseFloat(time).toFixed(0).padStart(2, "0");

    let input = `#05000${freqModify}${timeModify}000!`;

    return input;
  }
  log("sent time", time.value);
  log(`Sent this Frequency ${frequency.value}`);
  log(`Sent this command`, inputs(frequency.value, time.value));
  log(
    "the length of the command is:",
    inputs(frequency.value, time.value).length
  );

  await sendCommandAndWaitForResponse(
    transmitCharacteristic,
    inputs(frequency.value, time.value)
  );
  if (returnValue == "") {
    return "The Command to test the device timed out: expected #06! but got nothing";
  } else {
    if (returnValue !== "#06!") {
      return `The Command to test the device did not return an expected response: expected #06! but got ${returnValue}`;
    }
  }
  log(`Got expected response ${returnValue}`);
  log("sending '#0599!'");

  // await sendCommandAndWaitForResponse(transmitCharacteristic, "#0599!");
  // if (returnValue == "") {
  //   return "The Command to test the device timed out: expected #06! but got nothing";
  // } else {
  //   if (returnValue !== "#06!") {
  //     return `The Command to test the device did not return an expected response: expected #06! but got ${returnValue}`;
  //   }
  // }
  // log(`Got expected response ${returnValue}`);
  // seems we need to wait for another unprompted response

  await waitForResponse();
  if (returnValue == "") {
    return "The Command to test the device timed out: expected #21! but got nothing";
  } else {
    if (returnValue !== "#21!") {
      return `The Command to test the device did not return an expected response: expected #21! but got ${returnValue}`;
    }
  }
  log(`Got expected response ${returnValue}`);

  // show the pass/fail buttons
  document.getElementById("passFailButtons").style.display = "block";
}

/* #3 */

function inputsToPayload() {
  const frequency = document.getElementById("frequency").value;
  const time = document.getElementById("time").value;
  const payload = `#05000${frequency}${time}0000!`;
  return [frequency, time, payload];
}

/* #4 */
document.querySelector("#doit").addEventListener("click", async function () {
  log("doing it");
  let [frequency, time] = inputsToPayload();
  /* #5 */

  try {
    Logger.clearLog();
    const error = await connectAndTest();
    if (error) {
      alert(`Error encountered: ${error}`);
      return;
    }
  } catch (e) {
    alert(`Error encountered: ${e.message}`);
  }
});

window.onload = () => {};
