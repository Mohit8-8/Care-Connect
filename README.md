# Care-Connect 🏥

A comprehensive doctor appointment booking platform built with Next.js, featuring real-time video consultations, credit-based booking system, and role-based access control.

## 🚀 Features

- **Multi-role Authentication**: Patient, Doctor, and Admin roles with Clerk authentication
- **Video Consultations**: Integrated Vonage video calling for doctor-patient appointments
- **Credit System**: Subscription-based credit allocation for appointment booking
- **Real-time Availability**: Dynamic doctor scheduling and availability management
- **Secure Payments**: Integrated payment processing for credit purchases
- **Admin Dashboard**: Comprehensive admin panel for user and system management

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, Tailwind CSS
- **Authentication**: Clerk
- **Database**: PostgreSQL with Prisma ORM
- **Video API**: Vonage Video API
- **UI Components**: Radix UI, Lucide React
- **Forms**: React Hook Form with Zod validation
- **Styling**: Tailwind CSS with custom animations

## 📋 Prerequisites

- Node.js 18+
- npm or yarn
- PostgreSQL database (or Neon cloud database)
- Clerk account for authentication
- Vonage account for video calling

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd Care-Connect
npm install
```

### 2. Environment Setup

Copy the environment template and configure your services:

```bash
cp _env .env.local
```

Update `.env.local` with your credentials:

```env
# Database
DATABASE_URL='your-postgresql-connection-string'

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your-clerk-publishable-key
CLERK_SECRET_KEY=your-clerk-secret-key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/onboarding
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding

# Vonage Video API
NEXT_PUBLIC_VONAGE_APPLICATION_ID=your-vonage-app-id
VONAGE_PRIVATE_KEY=lib/private.key
```

### 3. Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# (Optional) Seed the database
npx prisma db seed
```

### 4. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to access the application.

## 📁 Project Structure

```
Care-Connect/
├── app/                    # Next.js app router pages
│   ├── (auth)/            # Authentication pages
│   ├── (main)/            # Main application pages
│   └── api/               # API routes
├── components/            # Reusable UI components
│   └── ui/               # Base UI components
├── actions/              # Server actions
├── lib/                  # Utility libraries
│   ├── prisma.js        # Database client
│   └── utils.js         # Helper functions
├── prisma/               # Database schema and migrations
└── hooks/               # Custom React hooks
```

## 🔐 Authentication Setup

### Clerk Configuration

1. Create a new application in [Clerk Dashboard](https://dashboard.clerk.com/)
2. Configure sign-in/sign-up URLs:
   - Sign-in URL: `/sign-in`
   - Sign-up URL: `/sign-up`
   - After sign-in URL: `/onboarding`
   - After sign-up URL: `/onboarding`
3. Copy the API keys to your `.env.local`

### Database User Sync

The application automatically syncs Clerk users to the local database. When a user signs up:

1. Clerk creates the user account
2. User is redirected to onboarding
3. User selects role (Patient/Doctor)
4. User record is created in PostgreSQL database

## 👥 User Roles & Permissions

### Patient
- Browse verified doctors
- Book appointments using credits
- Join video consultations
- View appointment history
- Purchase credit packages

### Doctor
- Set availability schedule
- Accept/reject appointments
- Conduct video consultations
- View earnings and payouts
- Manage profile and credentials

### Admin
- Verify doctor credentials
- Manage user accounts
- Process payouts
- View system analytics
- Manage credit transactions

## 💳 Credit System

### Credit Allocation
- **Free Plan**: 2 credits (one-time)
- **Standard Plan**: 10 credits/month
- **Premium Plan**: 24 credits/month

### Credit Usage
- Each appointment costs 2 credits
- Credits are deducted from patient account
- Credits are added to doctor's account
- Monthly subscription credits are auto-allocated

## 📹 Video Consultations

### Vonage Setup

1. Create account at [Vonage Developer](https://developer.vonage.com/)
2. Create a Video API application
3. Download private key to `lib/private.key`
4. Copy Application ID to environment variables

### Video Session Flow

1. Patient books appointment
2. Vonage session is created automatically
3. Both patient and doctor receive session tokens
4. Video call starts at scheduled time
5. Session expires 1 hour after appointment end time

## 🗄️ Database Schema

### Core Models
- **User**: Authentication, roles, credits, profile info
- **Appointment**: Booking details, video session data
- **Availability**: Doctor scheduling slots
- **CreditTransaction**: Credit purchase/deduction records
- **Payout**: Doctor earnings and payment processing

## 🚀 Deployment

### Build for Production

```bash
npm run build
npm start
```

### Environment Variables for Production

Ensure all environment variables are set in your production environment:

- `DATABASE_URL` (production database)
- `CLERK_SECRET_KEY`
- `VONAGE_PRIVATE_KEY` (path to private key file)
- All `NEXT_PUBLIC_*` variables

## 🐛 Troubleshooting

### Common Issues

#### "User not found in database"
This occurs when Clerk user isn't synced to local database:

1. Check database connection
2. Verify Clerk webhooks are configured
3. Run database migrations: `npx prisma migrate dev`
4. Check user creation in onboarding flow

#### Video calls not working
1. Verify Vonage credentials in `.env.local`
2. Check private key file exists at `lib/private.key`
3. Ensure Application ID is correct
4. Check browser permissions for camera/microphone

#### Database connection errors
1. Verify `DATABASE_URL` format
2. Check database server is running
3. Ensure SSL settings are correct
4. Run `npx prisma generate` to refresh client

## 📚 API Reference

### Server Actions
- `bookAppointment()` - Book new appointment
- `getAvailableTimeSlots()` - Get doctor availability
- `generateVideoToken()` - Generate Vonage video token
- `checkAndAllocateCredits()` - Allocate monthly credits
- `setUserRole()` - Set user role during onboarding

### Database Queries
All database operations use Prisma client located in `lib/prisma.js`

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section above
- Review Clerk and Vonage documentation for service-specific issues

---

**Care-Connect** - Connecting patients with healthcare providers seamlessly! 🏥💻
