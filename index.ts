import "@logseq/libs"
import { SettingSchemaDesc } from '@logseq/libs/dist/LSPlugin';
import axios from 'axios';

const settingsSchema: SettingSchemaDesc[] = [
  {
    key: "OCR Provider",
    type: "enum",
    default: "HuggingFace",
    enumChoices: ["HuggingFace", "Local", "Gemini"],
    title: "OCR Provider",
    description: "Choose the OCR provider: HuggingFace, Local API, or Google Gemini API."
  },
  {
    key: "HuggingFace User Access Token",
    type: "string",
    default: "",
    title: "HuggingFace User Access Token",
    description:
      " Paste your HuggingFace User Access Token. For more information https://huggingface.co/docs/hub/security-tokens",
  },

  {
    key: "Local API Address",
    type: "string",
    default: "http://0.0.0.0:8503",
    title: "Local API Address",
    description: "Enter the IP address and port of the local API (e.g., http://0.0.0.0:8503). Only used if 'Local' is selected as OCR Provider."
  },
  {
    key: "Gemini API Key",
    type: "string",
    default: "",
    title: "Google Gemini API Key",
    description:
      "Paste your Google Gemini API Key. For more information https://ai.google.dev/gemini-api/docs/api-key. Only used if 'Gemini' is selected as OCR Provider.",
  }
]



async function query_huggingface(data: any) {

  const access_token = logseq.settings!["HuggingFace User Access Token"]

  

  if (!access_token) {
    console.error("Access token not found. Please enter the user token in the settings.");
    logseq.UI.showMsg('Access token not found. Please enter the user token in the settings.', 'error')
    return;
  }

  const response = await fetch(
    "https://api-inference.huggingface.co/models/Norm/nougat-latex-base", 
    {
      headers: { Authorization: `Bearer ${access_token}`},
      method: "POST",
      body: data,
    }
  );

  const result = await response.json();

  // If there is an error, wait for the estimated time and retry
  if (result.error) {
    console.log('error: ', result.error);
    console.log('estimated_time: ', result.estimated_time);

    // Convert the estimated_time from seconds to milliseconds
    const waitTime = result.estimated_time * 1000;
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(query_huggingface(data));
      }, waitTime);
    });
  }
  
  // If there is no error, return the result
  console.log('result: ',result);
  console.log('result[0].generated_text: ', result[0].generated_text);
  return result[0].generated_text;
}


async function query_local(data: any) {
  const formData = new FormData();
  formData.append('image', data, 'image/png'); 

  const additionalData = {
    file_type: 'formula',            // string : 'pdf', 'page', 'text_formula', 'formula', 'text'
    resized_shape: 768,             // int: Resize the image width to this size for processing; default value is 768
  };

  Object.keys(additionalData).forEach(key => formData.append(key, additionalData[key]));

  try {
    const serverurl= logseq.settings!["Local API Address"]

    const response = await axios.post(`${serverurl}/pix2text`, formData);

    const outs = response.data.results.replace(/\$\$/g, '').trim();

    let onlyText;
    if (typeof outs === 'string') {
      onlyText = outs;
    } else {
      onlyText = outs.map(out => out.text).join('\n');
    }
    return onlyText;

  } catch (error) {
    console.error("Local API request failed: ", error);
    logseq.UI.showMsg('Local API request failed: ' + error.message, 'error');
  }
}

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result.split(',')[1]); // Remove the data URI prefix
      } else {
        reject(new Error("Failed to convert blob to base64 string."));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function query_gemini(data: Blob, ocrType: 'formula' | 'table') {
  const apiKey = logseq.settings!["Gemini API Key"];

  if (!apiKey) {
    console.error("Gemini API Key not found. Please enter the API key in the settings.");
    logseq.UI.showMsg('Gemini API Key not found. Please enter the API key in the settings.', 'error');
    return;
  }

  const base64ImageData = await blobToBase64(data);

  const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`;

  const formulaPrompt = "Extract any formulas from this image as a LaTeX math expression in markdown format. The image may contain mathematical formulas and text. For any text with inline formulas, ensure only the formula part is formatted with single dollar signs ($). Use OCR to extract everything accurately, preserving all symbols and formatting. Return only the extracted content in raw markdown-compatible LaTeX. Do not include any comments, explanations, or code block formatting like ```markdown or ```latex.";
  const tablePrompt = "Extract the table from this image into a Markdown table format. If any cells in the table contain mathematical equations, make sure to wrap them in single dollar signs ($) for inline LaTeX rendering. Your response should contain ONLY the raw Markdown for the table, without any surrounding text, comments, explanations, or code block formatting like ```markdown or ```.";

  const promptText = ocrType === 'table' ? tablePrompt : formulaPrompt;

  try {
    const response = await axios.post(
      GEMINI_API_URL,
      {
        contents: [
          {
            parts: [
              {
                text: promptText
              },
              { inline_data: { mime_type: "image/png", data: base64ImageData } }
            ]
          }
        ]
      },
      {
        headers: { 'x-goog-api-key': apiKey }
      }
    );

    const text = response.data.candidates[0].content.parts[0].text;
    if (ocrType === 'table') {
      // For tables, keep dollar signs for equations and remove any surrounding code block ticks.
      return text.replace(/^```(markdown)?\n?/, '').replace(/\n?```$/, '').trim();
    } else {
      return text.replace(/\$\$/g, '').replace(/\$/g, '').trim(); // For formulas, clean up potential markdown wrappers
    }
  } catch (error) {
    console.error("Gemini API request failed: ", error.response?.data || error.message);
    logseq.UI.showMsg('Gemini API request failed: ' + (error.response?.data?.error?.message || error.message), 'error');
  }
}

async function formula_ocr(ocrType: 'formula' | 'table' = 'formula') {
  try {
    // Necessary to focus the window before reading the clipboard
    window.focus();

    const clipboardItem = await navigator.clipboard.read()
    if (!clipboardItem) {
      console.error('Clipboard item is empty')
      return
    }
    console.log('Clipboard item: ', clipboardItem)
    const data = await clipboardItem[0].getType('image/png').catch(err => {
      throw new Error('Clipboard item is not an image')
    })

    console.log('Clipboard data: ', data)

    const ocrProvider = logseq.settings!["OCR Provider"];
    let ocrResult;

    switch (ocrProvider) {
      case "Local":
        ocrResult = await query_local(data);
        break;
      case "Gemini":
        ocrResult = await query_gemini(data, ocrType);
        break;
      default: // "HuggingFace"
        ocrResult = await query_huggingface(data);
        break;
    }

    return ocrResult
  } catch (err) {
    logseq.UI.showMsg('Reading image failed: ' + err, 'error')
  }
}

async function registerOcrCommand(command: string, wrapper: [string, string], ocrType: 'formula' | 'table' = 'formula') {
  logseq.Editor.registerSlashCommand(command, async () => {
    const text = await formula_ocr(ocrType);
    if (text) {
      const latexText = `${wrapper[0]}${text}${wrapper[1]}`;
      await logseq.Editor.insertAtEditingCursor(latexText);
    }
  });
}

async function main() {
  logseq.useSettingsSchema(settingsSchema);

  await registerOcrCommand('display-formula-ocr', ['$$', '$$']);
  await registerOcrCommand('inline-formula-ocr', ['$', '$']);
  await registerOcrCommand('table-ocr', ['', ''], 'table');

  console.log('Formula OCR plugin loaded');
}


// bootstrap
logseq.ready(main).catch(console.error)
