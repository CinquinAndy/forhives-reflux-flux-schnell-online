# ReFlux by ForHives - Flux Schnell Client Interface

## Overview

This project is a fork of [Replicate's ReFlux](https://github.com/replicate/reflux), modified to work specifically with the Flux Schnell model. It provides a user-friendly web interface for generating images using the Flux Schnell model through Replicate's API.

## Features

- Direct integration with Flux Schnell model
- Real-time image generation
- Customizable parameters:
  - Aspect ratio selection
  - Output quality control
  - Multiple output formats (WebP, JPG, PNG)
  - Batch generation (up to 4 images)
- Image download functionality
- Responsive design

## Prerequisites

- Node.js (v16 or higher)
- Replicate API token ([Get it here](https://replicate.com/account/api-tokens))
- npm or yarn package manager

## Installation

1. Clone the repository:
```bash
git clone https://github.com/CinquinAndy/forhives-reflux-flux-schnell-online.git
cd forhives-reflux-flux-schnell-online
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Start the development server:
```bash
npm run dev
# or
yarn dev
```

4. Build for production:
```bash
npm run build
# or
yarn build
```

## Usage

1. Open the application in your browser (default: `http://localhost:3000`)
2. Enter your Replicate API token in the top-right input field
3. Configure your generation parameters:
   - Write your prompt
   - Select aspect ratio
   - Adjust quality settings
   - Choose output format
4. Click "Create" to generate images
5. Download or manage your generated images

## Security Note

This application requires your Replicate API token to be entered directly in the client interface. The token is stored in your browser's local storage and is only used for API calls to Replicate. Never share your API token or commit it to version control.

## Technical Stack

- [Nuxt.js](https://nuxt.com/) 3.x
- [Vue.js](https://vuejs.org/) 3.x
- [Pinia](https://pinia.vuejs.org/) for state management
- [Nuxt UI](https://ui.nuxt.com/) for the user interface

## Development

The project structure follows Nuxt.js conventions:
- `components/` - Vue components
- `pages/` - Application pages
- `stores/` - Pinia stores
- `server/` - API routes

## Credits

This project is a fork of [Replicate's ReFlux](https://github.com/replicate/reflux), modified to work specifically with the Flux Schnell model. Original concept and base implementation by Replicate team.

## License

[MIT License](LICENSE.md)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Support

For support, please open an issue in the GitHub repository or contact the maintainers.

## Disclaimer

This is an unofficial client for the Flux Schnell model on Replicate. It is not affiliated with or endorsed by Replicate or the model creators.