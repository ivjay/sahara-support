# 🎫 Sahara Support System

AI-powered conversational booking system for Nepal, supporting bus tickets, flight bookings, doctor appointments, and movie tickets with integrated payment processing.

## ✨ Features

- 🤖 **AI Chat Agent** - Natural Nepanglish conversation powered by Ollama
- 🎟️ **Multi-Service Booking** - Bus, Flight, Appointments, Movies
- 💳 **Payment Integration** - eSewa, Khalti, and Cash on Counter
- 🎫 **Seat Selection** - Real-time seat maps with live availability
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile
- 🔄 **Real-time Updates** - Live seat availability via Supabase Realtime
- 👨‍💼 **Admin Panel** - Manage bookings and verify payments

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- [Ollama](https://ollama.ai/) installed locally
- Supabase account

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd sahara-support-system
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Ollama (defaults to localhost)
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=llama3.2:latest

# eSewa Payment Gateway
ESEWA_MERCHANT_CODE=your_merchant_code
ESEWA_SECRET_KEY=your_secret_key
ESEWA_SUCCESS_URL=http://localhost:3000/api/payment/esewa/success
ESEWA_FAILURE_URL=http://localhost:3000/api/payment/esewa/failure

# Khalti Payment Gateway
KHALTI_PUBLIC_KEY=your_public_key
KHALTI_SECRET_KEY=your_secret_key
KHALTI_RETURN_URL=http://localhost:3000/api/payment/khalti/callback
```

4. **Set up Ollama**
```bash
# Pull the required model
ollama pull llama3.2:latest

# Start Ollama (if not running)
ollama serve
```

5. **Run database migrations**

Upload the SQL files in `supabase/migrations/` to your Supabase project:
- `001_initial_schema.sql`
- `002_update_seat_layouts.sql`
- `003_create_payments_table.sql`

6. **Start development server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 💳 Payment Gateway Setup

### eSewa Integration

1. Register at [eSewa Developer Portal](https://developer.esewa.com.np/)
2. Get your Merchant Code and Secret Key
3. Add credentials to `.env.local`
4. For testing, use sandbox URL (automatically used in development)

### Khalti Integration

1. Register at [Khalti](https://khalti.com/)
2. Get your Public Key and Secret Key from the dashboard
3. Add credentials to `.env.local`
4. For testing, use test mode (automatically used in development)

### Testing Payments

In development mode:
- eSewa uses sandbox: `https://uat.esewa.com.np/`
- Khalti uses test mode: `https://a.khalti.com/`
- Test credentials are accepted
- No real money is charged

## 📁 Project Structure

```
sahara-support-system/
├── app/
│   ├── actions/          # Server actions (chat processing)
│   ├── admin/            # Admin panel pages
│   ├── api/              # API routes
│   │   ├── bookings/     # Booking management
│   │   ├── payment/      # Payment processing
│   │   └── seats/        # Seat availability
│   ├── chat/             # Main chat interface
│   └── payment/          # Payment result pages
├── components/
│   ├── admin/            # Admin components
│   ├── booking/          # Booking wizard & steps
│   │   ├── steps/        # Individual wizard steps
│   │   └── seats/        # Seat selection components
│   ├── chat/             # Chat UI components
│   └── ui/               # Reusable UI components
├── lib/
│   ├── booking/          # Booking state management
│   ├── chat/             # Chat agent & prompts
│   ├── db/               # Database abstraction
│   ├── integrations/     # External integrations (Ollama)
│   └── services/         # Business logic (payments, etc.)
└── supabase/
    └── migrations/       # Database migrations
```

## 🔧 Key Technologies

- **Frontend**: Next.js 16, React, TypeScript, Tailwind CSS
- **Backend**: Next.js Server Actions, API Routes
- **Database**: Supabase (PostgreSQL + Realtime)
- **AI**: Ollama (llama3.2:latest)
- **Payments**: eSewa, Khalti APIs
- **State Management**: React useReducer, Context API

## 📖 Documentation

See [CLAUDE.md](./CLAUDE.md) for detailed architecture documentation.

See [PAYMENT_INTEGRATION_PLAN.md](./PAYMENT_INTEGRATION_PLAN.md) for payment integration details.

## 🧪 Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

## 🔐 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `OLLAMA_BASE_URL` | Ollama API endpoint | No (defaults to localhost) |
| `OLLAMA_MODEL` | Ollama model name | No (defaults to llama3.2) |
| `ESEWA_MERCHANT_CODE` | eSewa merchant code | For eSewa payments |
| `ESEWA_SECRET_KEY` | eSewa secret key | For eSewa payments |
| `KHALTI_PUBLIC_KEY` | Khalti public key | For Khalti payments |
| `KHALTI_SECRET_KEY` | Khalti secret key | For Khalti payments |

## 🚀 Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

**Important**: Ensure Ollama is accessible from your deployment (use hosted LLM or VPS with Ollama)

### Self-Hosted

1. Build the application: `npm run build`
2. Start production server: `npm start`
3. Ensure Ollama is running and accessible
4. Configure reverse proxy (nginx/caddy) for HTTPS

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Powered by [Ollama](https://ollama.ai/)
- Database by [Supabase](https://supabase.com/)
- Payment gateways: [eSewa](https://esewa.com.np/), [Khalti](https://khalti.com/)
