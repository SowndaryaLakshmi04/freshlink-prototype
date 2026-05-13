# FreshLink🌾

A farm-to-buyer web platform built to help farmers in Tamil Nadu sell their produce directly to buyers — no middlemen, fair prices, and instant payments.

> This is a frontend-only demo project built as part of a learning exercise. No real payments or GPS are involved.

---

## What is this project?

FreshLink is a web app where farmers can list their harvests and buyers can purchase directly from them. I built this to explore how a real agri-tech platform might work, and to practice building multi-role apps with AI integration.

The app has two types of users:
- **Farmers** — post crops, track deliveries, get paid
- **Buyers** — browse listings, place orders, verify produce quality

The coolest feature is the **AI crop quality checker** — you upload a photo of a crop and Anthropic's AI analyses it and gives you a quality grade, freshness score, and a fair price suggestion.

---

## Features

**Farmer side**
- Post a harvest listing (crop, quantity, price, photo, location)
- View revenue charts and crop distribution
- Track active deliveries in real time
- Receive payment via escrow after delivery is confirmed

**Buyer side**
- Browse and search the marketplace
- Track orders with a live progress bar
- Use AI to verify the quality of received produce before releasing payment
- See how much you saved compared to mandi prices

**AI Quality Check** 🤖
- Upload a crop photo
- Get back: quality grade (A/B/C), freshness score, defect notes, and a suggested price range

**Other stuff**
- Dark mode
- Multilingual — English, Tamil, Hindi
- Demo login (no account needed to try it)

---

## Tech Stack

| What | How |
|---|---|
| HTML / CSS / JS | No frameworks — just vanilla web |
| Charts | Chart.js 4.4 |
| AI | Anthropic API |
| Backend | None (frontend-only demo) |

---

## File Structure

```
freshlink/
├── index.html              # All the pages and UI
├── style.css               # Styling (includes dark mode)
├── app.js                  # All the logic + AI integration
└── freshlink-logo.png      # Logo
```

---

## Try the Demo

On the login screen, hit **Quick demo login** to sign in as one of these test accounts:

| Name | Role |
|---|---|
| Rajan Kumar | Farmer |
| Murugan S | Farmer |
| Priya Retail Hub | Buyer |
| Chennai FreshMart | Buyer |

---

## What I'd add next

- [ ] A real backend (Node.js + database)
- [ ] Actual UPI payment integration
- [ ] Real GPS tracking using the browser's location API
- [ ] PWA support so farmers can use it on mobile offline
- [ ] WhatsApp notifications for order updates

---

## Acknowledgements

- AI powered by [Anthropic](https://www.anthropic.com)
- Charts by [Chart.js](https://www.chartjs.org)
- Built with love for Tamil Nadu's farming community 🌾
