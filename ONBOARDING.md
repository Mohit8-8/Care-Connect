# Care-Connect Onboarding Guide

Welcome to the Care-Connect project! This document provides a concise onboarding guide to help new developers and users get started quickly and effectively.

---

## Project Overview

Care-Connect is a comprehensive doctor appointment booking platform built with Next.js. It features real-time video consultations, a credit-based booking system, and role-based access control for Patients, Doctors, and Admins.

For detailed project information, features, and architecture, please refer to the [README.md](./README.md).

---

## Prerequisites

Before setting up the project, ensure you have the following:

- Node.js 18+ installed
- PostgreSQL database access (local or cloud)
- Clerk account for authentication
- Vonage account for video calling
- Git repository cloned

---

## Setup Instructions

Please follow the detailed setup instructions in the [SETUP.md](./SETUP.md) file. Key steps include:

1. Environment variable configuration
2. Database setup and migrations
3. Clerk authentication setup
4. Vonage Video API configuration
5. Starting the development server

---

## Usage Guide

- Access the application at `http://localhost:3000` after starting the development server.
- User roles include Patient, Doctor, and Admin, each with specific permissions.
- Book appointments, manage schedules, and conduct video consultations.
- Refer to the [README.md](./README.md) for detailed usage and feature descriptions.

---

## Troubleshooting

Common issues and solutions are documented in the [SETUP.md](./SETUP.md) troubleshooting section. Notably:

- "User not found in database" error during onboarding usually indicates a sync issue between Clerk and the local database.
- Database connection errors and video call issues are also covered.

For additional troubleshooting, see the [troubleshoot.js](./troubleshoot.js) script.

---

## Additional Resources

- [README.md](./README.md) - Full project documentation
- [SETUP.md](./SETUP.md) - Detailed setup and troubleshooting guide
- [troubleshoot.js](./troubleshoot.js) - Debugging utilities

---

## Getting Help

If you encounter issues not covered in the documentation:

- Check application logs and terminal output
- Verify environment variables and service credentials
- Consult Clerk and Vonage official documentation
- Open an issue in the project repository

---

Thank you for contributing to Care-Connect! We hope this guide helps you get started smoothly.
