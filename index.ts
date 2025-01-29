import "@logseq/libs"
import { SettingSchemaDesc } from '@logseq/libs/dist/LSPlugin';
import axios from 'axios';

const settingsSchema: SettingSchemaDesc[] = [
  {
    key: "HuggingFace User Access Token",
    type: "string",
    default: "",
    title: "HuggingFace User Access Token",
    description:
      " Paste your HuggingFace User Access Token. For more information https://huggingface.co/docs/hub/security-tokens",
  },
  {
    key: "Use Local API",
    type: "boolean",
    default: false,
    title: "Use Local API",
    description: "Toggle to use the local API instead of HuggingFace API"
  },
  {
    key: "Local API Address",
    type: "string",
    default: "http://0.0.0.0:8503",
    title: "Local API Address",
    description: "Enter the IP address and port of the local API (e.g., http://0.0.0.0:8503)"
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

async function formula_ocr() {
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

    const useLocalAPI = logseq.settings!["Use Local API"]
    const ocrResult = useLocalAPI ? await query_local(data) : await query_huggingface(data)
    return ocrResult
  } catch (err) {
    logseq.UI.showMsg('Reading image failed: ' + err, 'error')
  }
}

async function main() {

    logseq.useSettingsSchema(settingsSchema);
    
    logseq.Editor.registerSlashCommand(
        'display-formula-ocr', 
        async () => {
            const text = await formula_ocr()
            const latexText = `$$${text}$$`;
            await logseq.Editor.insertAtEditingCursor(latexText)
        },
        )
    
    logseq.Editor.registerSlashCommand(
        'inline-formula-ocr', 
        async () => {
            const text = await formula_ocr()
            const latexText = `$${text}$`;
            await logseq.Editor.insertAtEditingCursor(latexText)
        },
        )  
        
    console.log('Formula OCR plugin loaded')
}


// bootstrap
logseq.ready(main).catch(console.error)