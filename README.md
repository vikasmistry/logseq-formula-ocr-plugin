# Logseq LaTeX Formula OCR Plugin

Convert LaTeX formula images from clipboard to LaTeX code in [Logseq](https://logseq.com/) using various OCR providers like Hugging Face Transformers, Google Gemini, or a local Pix2Text server.

## Features

- **Formula OCR**: Convert images of LaTeX formulas into editable LaTeX code.
- **Table OCR**: Convert images of tables into Markdown tables.
- **Multiple OCR Providers**: Choose from several backends:
    - **Google Gemini**: High-quality formula and table recognition.
    - **OpenAI Compatible**: Connect to any OpenAI-compatible API (e.g., Local LLMs, Groq, OpenRouter).
    - **Pix2Text (Local)**: A private, offline-first OCR server.
    - **Hugging Face API**: Cloud-based processing using the Nougat model.
    - **Docker (Self-hosted)**: Run the Nougat OCR model in a local Docker container.

## Commands

- `/display-formula-ocr`: Insert LaTeX code on a new line
- `/inline-formula-ocr`: Insert LaTeX code within a paragraph
- `/table-ocr`: Insert a Markdown table from an image. Currently works best with the Gemini provider.

> **Notes**: 
> + The image in the clipboard must be a LaTex formula image
> + Initial use may be slow due to model loading
> + With the free Hugging Face plan you can make about 30k calls per month
> + The Google Gemini API has a free tier with usage limits. Check the [official pricing page](https://ai.google.dev/pricing) for details.


## Installation Options

1. **Manual + Gemini (Recomended)**
    - Requirements: [Google Gemini API Key](https://aistudio.google.com/app/api-keys)
    - Download the zip file from [releases](https://github.com/vikasmistry/logseq-formula-ocr-plugin/releases) and unzip it.
    - Enable developer mode: `Logseq > Settings > Advanced > Developer mode`
    - Import Plugin: `Logseq > Plugins > Load unpacked plugin` and point to the unzipped folder.
    - Go to plugin settings, select "Gemini" as the OCR Provider.
    - Paste your Google Gemini API Key in the **API Key** setting field.

2. **Manual + OpenAI Compatible**
    - Requirements: An OpenAI-compatible API (e.g., OpenAI, Groq, Local LLM)
    - Download the zip file from [releases](https://github.com/vikasmistry/logseq-formula-ocr-plugin/releases) and unzip it.
    - Enable developer mode: `Logseq > Settings > Advanced > Developer mode`
    - Import Plugin: `Logseq > Plugins > Load unpacked plugin` and point to the unzipped folder.
    - Go to plugin settings, select "OpenAI Compatible" as the OCR Provider.
    - Enter your API Key in the **API Key** field.
    - Enter your API Endpoint in the **API Endpoint** field (e.g., `https://api.openai.com/v1` or `http://localhost:11434/v1`).
    - (Optional) Set the **Model Name** (default: `gpt-4o`).

3. **Manual + Pix2Text (Offline)**
   - Install Pix2Text [Python package](https://github.com/breezedeus/pix2text?tab=readme-ov-file#install)
   - Start the server, eg. ```p2t serve -l en -H 0.0.0.0 -p 8503 ```
   - Download the zip file from [releases](https://github.com/vikasmistry/logseq-formula-ocr-plugin/releases) and unzip it.
   - Enable developer mode: `Logseq > Settings > Advanced > Developer mode`
   - Import Plugin: `Logseq > Plugins > Load unpacked plugin` and point to the unzipped folder.
   - In the plugin settings, select "Local" as the OCR Provider and set the **API Endpoint** to the appropriate IP address and port (default is http://0.0.0.0:8503)
 
 4. **Manual + Hugging Face**
    - Requirements: [Node.js](https://nodejs.org/en), [Yarn](https://yarnpkg.com/), [Parcel](https://parceljs.org/), [Hugging Face User Access Token](https://huggingface.co/docs/hub/security-tokens)
    - Clone repo: `git clone https://github.com/olmobaldoni/logseq-formula-ocr-plugin.git`
    - Install dependencies: `cd logseq-formula-ocr-plugin && yarn && yarn build`
    - Enable developer mode: `Logseq > Settings > Advanced > Developer mode`
    - Import Plugin: `Logseq > Plugins > Load unpacked plugin` and point to the cloned repo

5. **Marketplace + Hugging Face**
   - Requirements: [Hugging Face User Access Token](https://huggingface.co/docs/hub/security-tokens)
   - Search for `LaTeX Formula OCR` in the Logseq marketplace and install directly

6. **Marketplace + Docker**
    - Requirements: [Docker](https://www.docker.com/)
    - Search for `LaTeX Formula OCR` in the Logseq marketplace and install directly
    - Pull image: `docker pull olmobaldoni/nougat-ocr-api:latest`
    - Run container: `docker run -d -p 80:80 olmobaldoni/nougat-ocr-api:latest`

> **Note**: For more information on how to use the other local API visit: https://github.com/olmobaldoni/LaTex-Formula-OCR-API



![Settings](./settings.png)


## Demo

- ### Demo 1

![Demo 1](./demo_1.gif)

- ### Demo 2

![Demo 2](./demo_2.gif)


## Known Issues

Hugging Face API may truncate responses (see [Issuee #2](https://github.com/NormXU/nougat-latex-ocr/issues/2) and [Issue #487](https://github.com/huggingface/huggingface.js/issues/487))

> **Note**: <ins> Docker or Local(Pix2Text) method recommended for full functionality </ins>

## Credits

This plugin is based on [nougat-latex-base](https://huggingface.co/Norm/nougat-latex-base), a fine-tuning of [facebook/nougat-base](https://huggingface.co/facebook/nougat-base) with [im2latex-100k](https://zenodo.org/records/56198#.V2px0jXT6eA), and made by [NormXU](https://github.com/NormXU).

[Pix2Text](https://github.com/breezedeus/pix2text): Used for the local OCR server.

[Google Gemini](https://ai.google.dev/): Used as one of the OCR providers.

In addition, this plugin was also inspired by [xxchan](https://github.com/xxchan) and its plugin [logseq-ocr](https://github.com/xxchan/logseq-ocr)




## License

MIT
