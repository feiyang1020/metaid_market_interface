# MetaID Market Frontend

A decentralized marketplace frontend for trading MRC-20 tokens and digital assets on the Bitcoin network, powered by MetaID protocol.

## Features

- **MRC-20 Token Trading**: Buy, sell, and list MRC-20 tokens on the marketplace
- **Token Minting**: Inscribe and mint new MRC-20 tokens
- **ID Coins**: Support for MetaID-based identity coins
- **Order Management**: Track pending orders, transaction history, and order status
- **Wallet Integration**: Seamless integration with MetaID wallet
- **Multi-language Support**: Available in English and Chinese

## Tech Stack

- **Framework**: [UmiJS](https://umijs.org/) - React application framework
- **UI Library**: [Ant Design](https://ant.design/) - Enterprise-class UI design language
- **Blockchain**: Bitcoin network with MetaID protocol
- **Libraries**:
  - `bitcoinjs-lib` - Bitcoin JavaScript library
  - `@metaid/metaid` - MetaID SDK
  - `meta-contract` - Smart contract interactions

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- pnpm (recommended) or npm

### Installation

```bash
# Clone the repository
git clone https://github.com/metaid-developers/metaid-market-frontend.git

# Navigate to project directory
cd metaid-market-frontend

# Install dependencies
pnpm install
```

### Development

```bash
# Start development server
pnpm dev
```

### Build

```bash
# Build for production
pnpm build
```

## Project Structure

```
src/
├── components/     # Reusable UI components
├── config/         # Configuration files
├── hooks/          # Custom React hooks
├── layouts/        # Page layouts
├── locales/        # Internationalization files
├── models/         # State management
├── pages/          # Application pages
├── services/       # API services
└── utils/          # Utility functions
```

## Key Pages

- **Home**: Browse and discover listed tokens
- **MRC-20**: View and trade MRC-20 tokens
- **Inscribe**: Mint new tokens
- **Launch**: Token launch platform
- **History**: Transaction history
- **Holders**: Token holder information

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the [MIT License](LICENSE).

## Links

- [MetaID Protocol](https://metaid.io)
- [Documentation](https://docs.metaid.io)
