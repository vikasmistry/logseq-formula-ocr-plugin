# Changelog

## [0.0.8]

### Added
- **OpenAI Compatible Support**: Added support for any OpenAI-compatible API provider (e.g., local LLMs, Groq, OpenRouter).
- **Gemini SDK**: Migrated to the official `@google/generative-ai` SDK for better performance and reliability.
- **Unified Settings**: Refactored settings to use a single "API Key" and "API Endpoint" for all providers, simplifying configuration.


## [0.0.7]

### Added
- **Google Gemini Support**: Integrated Google Gemini as a new OCR provider for high-quality formula and table recognition.
- **Table OCR Command**: Introduced a new `/table-ocr` command to convert images of tables into Markdown format. This feature currently works best with the Gemini provider.
- **New Settings**:
    - Added a setting to input the Google Gemini API Key.
    
## [0.0.6]

### Added
- **Local Pix2Text Server Support**: Added the ability to connect to a local `pix2text` server for offline OCR processing, enhancing privacy and enabling offline use.
- **New Settings**:
    - Added settings to configure the local OCR provider and server address.
