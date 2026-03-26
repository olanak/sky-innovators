import resend
import os
from dotenv import load_dotenv

load_dotenv()
resend.api_key = os.getenv("RESEND_API_KEY")

def send_reset_email(to_email: str, reset_link: str):
    try:
        params = {
            "from": "Sky Innovators <onboarding@resend.dev>", # Use this default for testing
            "to": [to_email],
            "subject": "Reset your SkyInnovators Password",
            "html": f"""
                <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee;">
                    <h2>Password Reset Request</h2>
                    <p>You requested to reset your password for SkyInnovators.</p>
                    <p>Click the button below to set a new one. This link expires in 1 hour.</p>
                    <a href="{reset_link}" style="background: #0891b2; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none; display: inline-block;">Reset Password</a>
                    <p style="margin-top: 20px; font-size: 12px; color: #666;">If you didn't request this, you can safely ignore this email.</p>
                </div>
            """,
        }
        resend.Emails.send(params)
        return True
    except Exception as e:
        print(f"Error sending email: {e}")
        return False