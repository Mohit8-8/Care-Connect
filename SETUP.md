# Care-Connect Setup Guide 🚀

This guide provides step-by-step instructions to set up and troubleshoot the Care-Connect application, especially addressing common database and authentication issues.

## 📋 Complete Setup Checklist

### ✅ Prerequisites
- [ ] Node.js 18+ installed
- [ ] PostgreSQL database access
- [ ] Clerk account created
- [ ] Vonage account created
- [ ] Git repository cloned

### ✅ Environment Configuration
- [ ] Environment variables configured
- [ ] Database connection tested
- [ ] Clerk authentication set up
- [ ] Vonage video API configured

### ✅ Database Setup
- [ ] Prisma client generated
- [ ] Database migrations run
- [ ] User sync working properly

---

## 🔧 Detailed Setup Instructions

### 1. Environment Variables Setup

Create your `.env.local` file by copying from `_env`:

```bash
cp _env .env.local
```

**Required Environment Variables:**

```env
# Database - REQUIRED
DATABASE_URL='postgresql://username:password@host:port/database?sslmode=require'

# Clerk Authentication - REQUIRED
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
CLERK_SECRET_KEY=sk_test_your_secret_here
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/onboarding
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding

# Vonage Video API - REQUIRED for video calls
NEXT_PUBLIC_VONAGE_APPLICATION_ID=your_vonage_app_id
VONAGE_PRIVATE_KEY=lib/private.key
```

### 2. Database Setup

#### Option A: Local PostgreSQL
```bash
# Install PostgreSQL locally
# Create database: care_connect
createdb care_connect

# Update DATABASE_URL in .env.local
DATABASE_URL='postgresql://localhost:5432/care_connect?sslmode=disable'
```

#### Option B: Cloud Database (Recommended)
The project is configured for Neon PostgreSQL. Update your `DATABASE_URL` with your Neon credentials.

### 3. Install Dependencies

```bash
npm install
```

### 4. Database Migration & Setup

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Verify database connection
npx prisma studio
```

### 5. Clerk Authentication Setup

1. **Create Clerk Application:**
   - Go to [Clerk Dashboard](https://dashboard.clerk.com/)
   - Create new application
   - Copy API keys to `.env.local`

2. **Configure URLs in Clerk Dashboard:**
   - Sign-in URL: `http://localhost:3000/sign-in`
   - Sign-up URL: `http://localhost:3000/sign-up`
   - After sign-in URL: `http://localhost:3000/onboarding`
   - After sign-up URL: `http://localhost:3000/onboarding`

3. **Enable Webhooks (Optional but Recommended):**
   - Webhook URL: `http://localhost:3000/api/webhooks/clerk`
   - Events: `user.created`, `user.updated`

### 6. Vonage Video API Setup

1. **Create Vonage Account:**
   - Go to [Vonage Developer](https://developer.vonage.com/)
   - Create Video API application
   - Download private key to `lib/private.key`
   - Copy Application ID to `.env.local`

### 7. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to access the application.

---

## 🐛 Troubleshooting Guide

### Issue: "User not found in database"

**Symptoms:** Error occurs during onboarding when trying to set user role.

**Root Cause:** Clerk user exists but hasn't been synced to local database.

**Solutions:**

#### Solution 1: Check Database Connection
```bash
# Test database connection
npx prisma db ping

# View database contents
npx prisma studio
```

#### Solution 2: Manual User Sync
If webhooks aren't working, you can manually sync users:

1. Check if user exists in Clerk but not in database
2. The application should automatically create user records during onboarding
3. Verify the onboarding flow is working correctly

#### Solution 3: Reset Database (Development Only)
```bash
# Reset database (WARNING: Deletes all data)
npx prisma migrate reset

# Re-run migrations
npx prisma migrate dev
```

#### Solution 4: Check Clerk Webhook Configuration
1. Go to Clerk Dashboard → Webhooks
2. Verify webhook URL is correct
3. Check webhook logs for errors
4. Test webhook delivery

### Issue: Database Connection Errors

**Symptoms:** Cannot connect to database, migrations fail.

**Solutions:**

1. **Check DATABASE_URL format:**
   ```env
   # Correct format
   DATABASE_URL='postgresql://username:password@host:port/database?sslmode=require'

   # For local development
   DATABASE_URL='postgresql://localhost:5432/care_connect?sslmode=disable'
   ```

2. **Verify database server is running:**
   ```bash
   # For local PostgreSQL
   brew services start postgresql

   # For cloud databases, check status in dashboard
   ```

3. **Test connection manually:**
   ```bash
   psql $DATABASE_URL -c "SELECT 1;"
   ```

### Issue: Video Calls Not Working

**Symptoms:** Cannot generate video tokens, calls fail to start.

**Solutions:**

1. **Check Vonage credentials:**
   - Verify `NEXT_PUBLIC_VONAGE_APPLICATION_ID` is correct
   - Ensure `lib/private.key` exists and is valid
   - Check Vonage dashboard for application status

2. **Test Vonage connection:**
   ```bash
   # Install Vonage CLI if needed
   npm install -g @vonage/cli

   # Test API connection
   vonage apps:list
   ```

### Issue: Credits Not Allocating

**Symptoms:** Users not receiving monthly credits.

**Solutions:**

1. **Check subscription setup in Clerk:**
   - Verify subscription plans exist in Clerk
   - Check plan IDs match code expectations
   - Test subscription assignment

2. **Manual credit allocation:**
   ```javascript
   // Use this query to manually allocate credits
   await db.user.update({
     where: { id: userId },
     data: { credits: { increment: 10 } }
   });
   ```

---

## 🔍 Debugging Commands

### Database Debugging
```bash
# View all users
npx prisma studio

# Check migrations status
npx prisma migrate status

# View database logs
npx prisma db logs

# Reset and reapply migrations
npx prisma migrate reset --force
npx prisma migrate dev
```

### Application Debugging
```bash
# Start with verbose logging
DEBUG=* npm run dev

# Check for TypeScript errors
npx tsc --noEmit

# Lint code
npm run lint
```

### Environment Debugging
```bash
# Check environment variables
printenv | grep -E "(DATABASE|CLERK|VONAGE)"

# Verify .env.local is loaded
cat .env.local
```

---

## 📊 Health Check Commands

### Quick Health Check
```bash
# 1. Check database
npx prisma db ping

# 2. Check dependencies
npm ls --depth=0

# 3. Check build
npm run build

# 4. Start development server
npm run dev
```

### Database Health Check
```bash
# Check connection
npx prisma db ping

# View user count
npx prisma db execute --file <(echo "SELECT COUNT(*) FROM User;")

# Check recent appointments
npx prisma db execute --file <(echo "SELECT COUNT(*) FROM Appointment WHERE createdAt > NOW() - INTERVAL '24 hours';")
```

---

## 🚀 Production Deployment

### Environment Setup for Production

1. **Set production environment variables:**
   ```env
   NODE_ENV=production
   DATABASE_URL=your_production_db_url
   # ... other production credentials
   ```

2. **Build and deploy:**
   ```bash
   npm run build
   npm start
   ```

3. **Database migration in production:**
   ```bash
   npx prisma migrate deploy
   ```

---

## 📞 Support

If you continue experiencing issues:

1. **Check the error logs** in your terminal/browser console
2. **Verify all environment variables** are correctly set
3. **Test database connectivity** with `npx prisma db ping`
4. **Check Clerk and Vonage dashboards** for service status
5. **Review the troubleshooting section** above

For additional help, check the main README.md file or create an issue in the repository.

---

**Setup Complete!** 🎉

Once you've completed all the steps above, your Care-Connect application should be running successfully at `http://localhost:3000`.

If you encounter any issues during setup, refer to the troubleshooting section or check the application logs for detailed error messages.
