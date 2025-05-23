# Eventer

Eventer is an open-source event management and notification platform designed for individuals and teams who want to easily schedule, track, and get notified about important events. Built with Node.js and Express, Eventer features a modern, mobile-friendly interface and supports both email (SMTP) and Discord webhook notifications.

![Eventer Logo](public/images/logo-t.webp)

## Features

- **User Dashboard:** Create, edit, and delete events with a simple, responsive UI.
- **Bulk Actions:** Delete multiple events or clear completed events with confirmation modals.
- **Custom Notifications:**
  - Configure Account SMTP (email) and Discord webhook notifications.
  - Enable/disable notifications and set recipient email addresses.
- **Automated Reminders:**
  - Receive reminders 5 minutes before events and instant notifications when events start.
  - Notifications are sent via email and/or Discord, using your personal settings.
- **Modern UI:** Mobile-optimized, accessible, and easy to use.
- **Open Source & Donation-Powered:** 100% free to use, with development supported by community donations.

## Screenshots

![Dashboard Screenshot](public/images/logo-t.webp)

## Getting Started

### Prerequisites
- Node.js (v16+ recommended)
- npm

### Installation

1. **Clone the repository:**
   ```sh
   git clone https://github.com/RepGraphics/eventer.git
   cd eventer
   ```
2. **Install dependencies:**
   ```sh
   npm install
   ```
3. **Configure environment variables:**
   - Copy `.env.example` to `.env` and fill in the required values (see `.env` in this repo for reference).
4. **Start the server:**
   ```sh
   npm start
   ```
5. **Visit** [http://localhost:8080](http://localhost:8080) in your browser.

## Usage

- **Login:** Use your credentials to log in.
- **Dashboard:** Create, edit, and delete events. Use bulk actions for efficiency.
- **Settings:** Configure your email (SMTP) and Discord webhook notifications.
- **Notifications:** Get reminders and alerts for your events, sent according to your preferences.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## Support & Donations

Eventer is powered by the community. If you find this project useful, please consider supporting development with a donation:

- [GitHub Sponsors](https://github.com/sponsors/RepGraphics)

Your support helps keep Eventer free and open source for everyone.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

---

Made with ❤️ by [RepGraphics](https://github.com/RepGraphics)