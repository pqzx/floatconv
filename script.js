// global variables - default for single precision
const B16 = 0;
const B32 = 1;
const B64 = 2;

const BIAS = [15, 127, 1023];
const MBITS = [10, 23, 52];
const EXPLEN = [5, 8, 11];
const BITLEN = [16, 32, 64];

let precision = B32;

const load = () => {
  randomExample();
}

const setPrecision = n => {
  precision = n;
}

const submitFloat = () => {
  const inputFloat = document.getElementById("floatIn").value;
  const data = fromFloat(inputFloat);

  if (!data) {
    document.getElementById("messageFloat").innerText = "Not a decimal number";
    return;
  }
  else if (parseInt(data.hex, 16) == 0) {
    document.getElementById("messageFloat").innerText = "0 is a special case";
  }
  else {
    document.getElementById("messageFloat").innerText = "";
  }        

  // populate the page with data fields
  Object.keys(data).forEach( item => {
    document.querySelector(".f2h").querySelectorAll("."+item).forEach( e => {
      e.innerText = data[item];
    });
  });

  // manually adjust some fields
  document.getElementById("signSym").innerText = data.sign == 0 ? "+" : "-";
  if (intPost.innerText.length > 5) {
    intPost.innerText = intPost.innerText.slice(0, 3) + "...";
  }

  if (fracPre.innerText.length > 5) {
    fracPre.innerText = "..." + fracPre.innerText.slice(-3);
  }

  if (fracPost.innerText.length > 5) {
    fracPost.innerText = fracPost.innerText.slice(0, 3) + "...";
  }

  if (data.exponent < 0) {
    exp2.style.setProperty("border", "1px solid firebrick");
    exp1.style.setProperty("border", "none");
  }
  else {
    exp1.style.setProperty("border", "1px solid firebrick");
    exp2.style.setProperty("border", "none");
  }

  // get the fractional calculation steps
  const calcSteps = data.hex == 0 ? [] : fracCalcSteps(data.fractional, data.exponent)
  const tableBody = calcSteps.map( (item, idx)  => `<tr>
    <td class="${idx == 0 ? "fracColor" : ""}">${parseFloat(item.v).toPrecision(4)}</td>
    <td>${parseFloat(item.v2).toPrecision(4)}</td>
    <td><span class="${idx >= (0 - data.exponent) && idx < (MBITS[precision] - data.exponent) ? "fracMain" : ""}">${item.i}</span></td>
    </tr>`).join("");
  const stepsHtml = 
    `<p>Binary conversion of fractional part:</p>
    <div class="heightlim">
      <table>
        <thead>
          <tr>
            <td>Fractional</td>
            <td>Fractional * 2</td>
            <td>Integer</td>
          </tr>
        </thead>
        <tbody>${tableBody}</tbody>
      </table>
      ...
    </div>`
  document.getElementById("fracSteps").innerHTML = calcSteps.length > 0 ? stepsHtml : "";
  if (calcSteps.length == 0) {
    document.querySelector(".fractional").classList.remove("fracColor");
  }
  else {
    document.querySelector(".fractional").classList.add("fracColor");
  }

  // save a click to update the float input field for comparison
  if (data.hex == document.getElementById("hexIn").value) {
    submitHex();
  }
}

const submitResultFloat = () => {
  floatIn.value = floatOut.innerText;
  submitFloat();
}
const submitResultHex = () => {
  hexIn.value = hexOut.innerText;
  submitHex();
}

const submitHex = () => {
  const h = document.getElementById("hexIn").value;
  const data = fromHex(h);

  if (!data) {
    document.getElementById("messageHex").innerText = "Not a hexadecimal number";
    return;
  }
  else if (data.float == 0) {
    document.getElementById("messageHex").innerText = "0 is a special case";
  }
  else {
    document.getElementById("messageHex").innerText = "";
  }      

  Object.keys(data).forEach( key => {
    document.querySelector(".h2f").querySelectorAll("."+key).forEach( e => {
      e.innerText = data[key];
    })
  });

  // adjust manual fields
  const sameHex = true; //Math.abs(parseInt(document.getElementById("hexOut").innerText, 16) - parseInt(h, 16)) <= 1;
  diff.innerText = sameHex ? (Math.abs(floatIn.value - floatOut.innerText) / floatIn.value).toPrecision(4) : "";
  document.querySelector(".floatIn").innerText = sameHex ? floatIn.value : "";

  document.getElementById("signValue").innerText = data.sign == 0 ? "+" : "-";

  document.getElementById("bias").innerText = BIAS[precision];

  // populate mantissa conversion table
  const mbits = data.mantissa.split("").map((bit, i) => { 
    return {i, bit, value: Math.pow(2, -(i+1)) * bit} 
  });
  const mtable = mbits.map( e => 
    `<tr>
      <td>-${e.i+1}</td>
      <td class="mantissa">${e.bit}</td>
      <td class="${e.bit == 1 ? "highlight" : ""}">${e.value.toPrecision(4)}</td>
    </tr>`
  ).join("");
  const stepsHtml = 
  `<p>Get mantissa from bits:</p>
  <div class="heightlim">
    <table>
      <thead>
        <tr>
          <td>10^x</td>
          <td>Bit</td>
          <td>Value</td>
        </tr>
      </thead>
      <tbody>${mtable}</tbody>
      <tr>
        <td>Sum</td>
        <td></td>
        <td><span class="fractionalSum">${data.fractionalSum}</span></td>
      </tr>
    </table>
  </div>`
  document.getElementById("mantSteps").innerHTML = stepsHtml;
}

// n is in hex
const fromHex = n => {
  if (!isHex(n)) {
    return null;
  }

  if (Number(n) == 0) {
    return { bits: "0".repeat(BITLEN[precision]), sign: 0, exponent: "0".repeat(EXPLEN[precision]), 
    mantissa: "0".repeat(MBITS[precision]), fractionalSum: 0, expWBias: 0, exp: -BIAS[precision], float: 0 };
  }

  const bits = parseInt(n, 16).toString(2).padStart(BITLEN[precision], 0);
  const sign = bits[0];
  const exponent = bits.slice(1, 1 + EXPLEN[precision]);
  const expWBias = parseInt(exponent, 2);
  const exp = expWBias - BIAS[precision];
  const mantissa = bits.slice(1 + EXPLEN[precision]);
  const mantissaBits = mantissa.split("");
  const fractionalValues = mantissaBits.map((bit, i) => bit * Math.pow(2, -(i+1)));
  const fractionalSum = fractionalValues.reduce((accum, curr) => accum + curr);
  const sn = fractionalSum + 1;
  const float = Math.pow(-1, sign) * (sn * Math.pow(2, exp));

  return { bits, sign, exponent, mantissa, fractionalValues, fractionalSum, sn, expWBias, exp, float};
}

const fromFloat = n => {
  if (!isFloat(n)) {
    return null;
  }

  if (Number(n) == 0)
  {
    // special case - return fixed values / no calculation
    return { sign: 0, integral: 0, fractional: 0, exponent: -BIAS[precision], expWBias: 0, bExp: "00000000", intPre: 0, 
    intMain: "", intPost: "", fracPre: "", fracMain: "0".repeat(MBITS[precision]), fracPost: "", hex: "00000000" };
  }
  
  const sign = n < 0 ? 1 : 0; // negative = 1
  const fstr = getStringForm(Math.abs(n));
  const integral = Number(getIntPart(fstr));
  const fractional = Number(getFracPart(fstr));

  // get binary values of int/frac parts
  const bInt = int2Bin(fstr);
  const bFrac = frac2Bin(fstr);

  // get the binary exponent
  const exponent = getExponent(fstr);
  const expWBias = BIAS[precision] + exponent;
  const bExp = expWBias.toString(2).padStart(EXPLEN[precision], 0);

  // get the mantissa - we will divide the bInt and bFrac into parts that do/n't contribute to the mantissa
  const shift = Math.abs(exponent);
  const expIsNeg = exponent < 0;
  const fracPre = expIsNeg ? bFrac.slice(0, shift) : "";
  const fracMain = expIsNeg ? bFrac.slice(shift, shift + MBITS[precision]) 
    : shift > MBITS[precision] ? "" : bFrac.slice(0, MBITS[precision] - shift);
  const fracPost = expIsNeg ? bFrac.slice(shift + MBITS[precision]) 
    : shift > MBITS[precision] ? bFrac : bFrac.slice(MBITS[precision] - shift);

  const intPre = expIsNeg ? bInt : bInt[0];
  const intMain = expIsNeg ? "" : bInt.slice(1, MBITS[precision] + 1);
  const intPost = expIsNeg ? "" : bInt.slice(MBITS[precision] + 1);

  const mantissa = intMain + fracMain;
  const combined = sign + bExp + mantissa;
  const hex = parseInt(combined, 2).toString(16);

  return { sign, integral, fractional, exponent, expWBias, bExp, intPre, 
    intMain, intPost, fracPre, fracMain, fracPost, mantissa, combined, hex };
}

// n is a valid number
const getStringForm = n => {
  if (n.toString().toLowerCase().search("e") == -1) {
    // already in correct string form (i.e. not scientific notation)
    return n.toString();
  }
  const [numpart, exp] = n.toString().split("e");
  const fractional = numpart.replace(".", "");
  const expn = Number(exp);
  const x = expn < 0 ? "0." + fractional.padStart(-expn + fractional.length - 1, 0) : fractional.padEnd(expn + 1, 0);
  return x;
}

const isFloat = n => /^[0-9.e\-+]+$/i.test(n) && !isNaN(n);

const isHex = n => /^[0-9a-f]+$/i.test(n);

const getIntPart = n => n.toString().split(".")[0];

const getFracPart = n => "0." + (n.toString().split(".")[1] || 0);

const int2Bin = n => Number(getIntPart(n)).toString(2);

// get the binary representaion of fractional part of n
const frac2Bin = n => {
  const counter = Math.abs(getIntPart(n)) > 0;
  return frac2BinH(getFracPart(n), counter).flat(Infinity).join("");
}

// helper for frac2Bin
const frac2BinH = (value, counter) => counter > MBITS[precision] + 5 ?
  [] :
  [
    Math.trunc(value * 2), 
    frac2BinH(value * 2 - Math.trunc(value * 2), counter + (counter > 0 || value * 2 > 1))
  ];

const getExponent = n => getIntPart(n) == 0 ?
  -(frac2Bin(n).indexOf(1) + 1) : int2Bin(n).length - 1;

// generate the steps used to convert fractional part to binary
const fracCalcSteps = (initialValue, exponent) => fracH(initialValue, exponent).flat(Infinity) ;

// helper for fracCalcSteps
// same idea as frac2BinH, but we'll use the already calculated binary exponent value as counter
const fracH = (value, counter) =>
  counter > MBITS[precision] + 3 ? [] :
    [
      {v: value, v2: value * 2, i: Math.trunc(value * 2)}, 
      fracH(value * 2 - Math.trunc(value * 2), counter + 1)
    ];

const getRandomFloat = () => Math.random() > 0.5 ?
    Math.random() * Math.pow(10, Math.random() * BITLEN[precision] / 3) :
    Math.random() / Math.pow(10, Math.random() * BITLEN[precision] / 3);

const randomExample = () => {
  document.getElementById("floatIn").value = Math.random() > 0.5 ? getRandomFloat() : -getRandomFloat();
  submitFloat();
}

const randomHexExample = () => {
  const r = Math.pow((Math.random() + 0.1) * 10, 30);
  hexIn.value = r.toString(16).replace(".", "").slice(0, BITLEN[precision] / 4);
  submitHex();
}

const example = n => {
  setPrecision(B32);
  document.getElementById("floatIn").value = n;
  submitFloat();
  submitResultHex();
}

const example2 = (n1, n2) => {
  example(n1);
  document.getElementById("hexIn").value = n2;
  submitHex();
}

// TODO unit tests: generate 1000 random floats, convert to hex and back, check difference is small enough
// generate 1000 random hex, convert to float and back, check no difference
// also check all generated values are valid