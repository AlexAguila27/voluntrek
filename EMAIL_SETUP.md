# Email Notification Setup Guide

## Overview
This document provides instructions for setting up email notifications in the VolunTrek admin portal. The application uses Gmail SMTP for sending emails to NGOs for account approval and event notifications.

## Prerequisites
1. A Gmail account to use for sending notifications
2. An app-specific password for your Gmail account (2FA must be enabled)

## Setting Up App Password for Gmail

1. **Enable 2-Step Verification**:
   - Go to your Google Account settings: https://myaccount.google.com/
   - Select "Security" from the left menu
   - Under "Signing in to Google," select "2-Step Verification" and follow the steps

2. **Create an App Password**:
   - After enabling 2-Step Verification, go back to the Security page
   - Under "Signing in to Google," select "App passwords"
   - Select "Mail" as the app and "Other" as the device (name it "VolunTrek Admin")
   - Click "Generate"
   - Google will display a 16-character password. Copy this password.

## Configuring Environment Variables

1. Open the `.env.local` file in the root directory of the admin portal project
2. Update the following variables:
   ```
   # Email configuration
   EMAIL_USER=your-gmail-account@gmail.com
   EMAIL_PASS=your-app-specific-password
   ```
   Replace `your-gmail-account@gmail.com` with your actual Gmail address and `your-app-specific-password` with the app password generated in the previous step.

## Troubleshooting Email Issues

### Common Error Messages

1. **"Invalid login"**: 
   - Verify that you've entered the correct email address
   - Ensure you're using an app password, not your regular Gmail password
   - Check that 2FA is enabled on your Gmail account

2. **"Connection to email server failed"**:
   - Check your internet connection
   - Verify that port 587 is not blocked by your firewall
   - Try using a different network

3. **"Email authentication failed"**:
   - Verify that the EMAIL_USER and EMAIL_PASS environment variables are set correctly
   - Restart the application after updating environment variables

### Testing Email Configuration

After setting up your email credentials, you can test the configuration by:
1. Approving a pending NGO account
2. Creating a new event