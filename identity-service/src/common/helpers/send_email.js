import colors from "colors";

export const sendVerificationEmail = async (resend, email, code) => {
    console.log(colors.blue("📩 Sending verification email..."));
  
    try {
      const { error } = await resend.emails.send({
        from: "Acme <onboarding@resend.dev>",
        to: email,
        subject: `PayFlex Verification Code: ${code}`,
        html: `<p>Thank you for registering on our platform!<br><br>Your verification code is: <strong>${code}</strong></p>`,
      });
  
      if (error) {
        console.error(colors.red("❌ Error sending email:"), error);
        throw new Error("Could not send verification email.");
      }
  
      console.log(colors.green("📨 Verification email sent successfully"));
    } catch (error) {
      console.error(colors.red("❌ Failed to send verification email:"), error.message);
      throw new Error("Email delivery failed.");
    }
  };