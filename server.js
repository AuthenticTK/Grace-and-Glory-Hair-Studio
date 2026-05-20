import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

// Reconstruct __dirname in ES Module scope
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse incoming JSON payloads
app.use(express.json());

// Serve static frontend files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

/**
 * POST /api/book
 * Receives the booking payload from the client, logs/processes it server-side,
 * and returns the appropriate WhatsApp dispatch routing link.
 */
app.post('/api/book', (req, res) => {
    try {
        const { clientName, appointmentDate, location, specialNotes, services, totalCost } = req.body;

        // Basic server-side payload validation
        if (!clientName || !appointmentDate || !services || services.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Malformed request: Missing required booking parameters."
            });
        }

        // Format the date into a cleanly readable South African standard format
        const dateObj = new Date(appointmentDate);
        const formattedDate = dateObj.toLocaleString('en-ZA', {
            weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });

        // Map the services array cleanly for message consumption
        const mappedServices = services.map(s => `• ${s}`).join('\n');

        // Construct the message payload
        const rawMessage = `🌸 *New Appointment Booking Request* 🌸\n\n` +
            `*Client:* ${clientName}\n` +
            `*Date & Time:* ${formattedDate}\n` +
            `*Location:* ${location}\n\n` +
            `*Requested Services:*\n${mappedServices}\n\n` +
            `*Estimated Subtotal:* ${totalCost}\n` +
            (specialNotes ? `\n*Client Notes:* ${specialNotes}\n` : '') +
            `\n_Server Routed via Node.js Gateway_`;

        // Log the booking transaction securely on the server console (or save to DB)
        console.log(`\n[+] New Booking Registered for: ${clientName} at ${formattedDate}`);
        console.log(`[+] Total Value: ${totalCost} | Services: ${services.length}`);

        // Target Reception phone number mapped securely on the backend
        const targetNumber = "27647357201";
        const encodedPayload = encodeURIComponent(rawMessage);
        const routeUrl = `https://wa.me/${targetNumber}?text=${encodedPayload}`;

        // Respond back to the frontend with success status and actionable routing URI
        return res.status(200).json({
            success: true,
            dispatchUrl: routeUrl,
            message: "Booking successfully processed by server."
        });

    } catch (error) {
        console.error("[-] Backend Booking Processing Error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server processing failure."
        });
    }
});

// Fallback routing: Direct any unhandled paths back to the primary app interface
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Boot up server listening pipeline
app.listen(PORT, () => {
    console.log(`✨ Grace & Glory Studio server running live at: http://localhost:${PORT}`);
});

// Add this inside your server.js
app.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'about.html'));
});