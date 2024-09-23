# Deal News

Deal News is a web application designed to automate the extraction of deal news from various sources using Large Language Models (LLMs).

## Features

- **Deal Extraction**: Automatically extract deal information from various sources using LLMs.
- **Interactive UI**: Use lit-html for dynamic and efficient rendering.
- **Responsive Design**: Built with Bootstrap for a mobile-first, responsive design.
- **Dark Mode**: Easily switch between light and dark themes.

## Installation

To run this application locally, follow these steps:

1. Clone the repository and run any HTTP server, e.g.

   ```bash
   git clone https://github.com/gramener/dealnews.git
   cd dealnews
   python3 -m http.server  # or any other HTTP server
   ```

2. Open `index.html` in your preferred web browser.

## Usage

1. Login: The application requires an [LLM Foundry](https://llmfoundry.straive.com/) token for authentication.
2. Extract Deals:
   - Enter the URL of the source from which you want to extract deals.
   - Click the "Extract deals" button.
   - The extracted deals will be displayed in a table format.

## License

[MIT License](LICENSE).
